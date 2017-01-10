// This file provides some basic utilities for servers that allow the server
// to read in just a query id and be able to reconstruct the transformed query that
// lead the query id corresponds to.

import {
  ExtractGQL,
} from '../ExtractGQL';

import {
  OutputMap,
} from '../common';

import {
  print,
} from 'graphql';

import {
  Handler,
  Request,
  Response,
} from 'express';

// Given a path to the query map returned by ExtractGQL this function returns middleware
// for Express that expects a JSON body that contains JSON that looks like:
// {
//    'id': <id value>
// }
//
// The middleware then transforms this JSON object into a standard GraphQL request
// structure that contains the entire query document for that particular query id,
// as specified in the query map.
//
// Also takes an optional `lookupErrorHandler` that is called with the request, response
// and next objects in case there is an error in looking up and passing along the
// associated query, e.g. if a query id arrives that has no associated query.
export function createPersistedQueryMiddleware(
  queryMapPath: string,
  production: boolean = true,
  lookupErrorHandler?: Handler,
): Promise<Handler> {
  return new Promise<Handler>((resolve, reject) => {
    ExtractGQL.readFile(queryMapPath).then((queryMapString) => {
      const queryMap = JSON.parse(queryMapString);
      resolve(getMiddlewareForQueryMap(queryMap, production, lookupErrorHandler));
    }).catch((err: Error) => {
      reject(err);
    });
  });
}

// The same thing as `createPersistedQueryMiddleware` but takes the queryMap rather than
// a path to the query map.
//
// @param queryMap Map of queries outputted by the extractgql CLI tool
//
// @param production Boolean specifying whether this is a production environment. This middleware
// will only perform query mapping if this option is true.
//
// @param lookupErrorHandler An Express handler that is called when a query cannot be found
// in the query map. Only relevant if in a production environment.
export function getMiddlewareForQueryMap(
  queryMap: OutputMap,
  production: boolean = true,
  lookupErrorHandler?: Handler,
): Handler {
  const queryMapFunc = (queryId: (string | number)) => {
    // TODO this can be made O(1) if we have a reversible structure than a unidirectional
    // hash map.
    const matchedKeys = Object.keys(queryMap).filter((key) => {
      return (queryId !== undefined &&
              queryMap[key].id.toString() === queryId.toString());
    });

    // If we find no keys with then given id, then we just return
    // a false-y value.
    if (matchedKeys.length === 0 && lookupErrorHandler) {
      return Promise.reject(null);
    }

    return Promise.resolve(print(queryMap[matchedKeys[0]].transformedQuery));
  }

  return getMiddlewareForQueryMapFunction(queryMapFunc, production, lookupErrorHandler);
}

// The same thing as `createPersistedQueryMiddleware` but takes a function that,
// when evaluated for a particular query id, returns a Promise for the corresponding
// query string. Can be used to load persisted queries from a database rather than from
// a JSON file.
//
// @param queryMapFunc  Function from query ids to Promises for graphql document strings.
// Should reject the promise if the query id does not correspond to the graphql document
// string.
//
// @param production  Boolean specifying whether this is a production environment. This
// middlware will only perform query mapping if this option is true.
//
// @param lookupErrorHandler  An Express handler that is called when a query cannot be
// found in the query map. Only relevant if in ap roduction environment.
export type QueryMapFunction = (queryId: (string | number)) => Promise<string>;
export function getMiddlewareForQueryMapFunction(
  queryMapFunc: QueryMapFunction,
  production: boolean = true,
  lookupErrorHandler?: Handler,
): Handler {
  // If we are not in a production environment, then we don't want to do any query mapping
  // and we move to the next request handler.
  if (!production) {
    return ((req: Request, res: Response, next: any) => {
      next();
    });
  }

  return ((req: Request, res: Response, next: any) => {
    const queryId = req.body.id as (number | string);
    queryMapFunc(queryId).then((queryString) => {
      req.body.query = queryString;
      next();
    }).catch((err) => {
      // If we find no keys with then given id, then we just let the lookupErrorHandler
      // take care of the situation.
      lookupErrorHandler(req, res, next);
    });
  });
}

