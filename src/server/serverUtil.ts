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
  enablePersistedQueries: boolean = true,
  lookupErrorHandler?: Handler,
): Promise<Handler> {
  return new Promise<Handler>((resolve, reject) => {
    ExtractGQL.readFile(queryMapPath).then((queryMapString) => {
      const queryMap = JSON.parse(queryMapString);
      resolve(getMiddlewareForQueryMap(queryMap, enablePersistedQueries, lookupErrorHandler));
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
// @param enablePersistedQueries Boolean specifying whether to perform query mapping. If set to
// `false`, this middleware will just send the GraphQL document strings like a normal network
// interface.
//
// @param lookupErrorHandler An Express handler that is called when a query cannot be found
// in the query map. Only relevant if `enablePersistedQueries` is set to `true`.
export function getMiddlewareForQueryMap(
  queryMap: OutputMap,
  enablePersistedQueries: boolean = true,
  lookupErrorHandler?: Handler,
): Handler {
  const queryMapFunc = (queryId: (string | number)) => {
    // TODO this can be made O(1) if we have a reversible structure than a unidirectional
    // hash map.
    const matchedKeys = Object.keys(queryMap).filter((key) => {
      console.log('Id: ', queryMap[key]);
      return (queryId !== undefined &&
              queryMap[key].toString() === queryId.toString());
    });

    // If we find no keys with then given id, then we just return
    // a false-y value.
    if (matchedKeys.length === 0 && lookupErrorHandler) {
      return Promise.reject(null);
    }

    return Promise.resolve(matchedKeys[0]);
  };

  return getMiddlewareForQueryMapFunction(queryMapFunc, enablePersistedQueries, lookupErrorHandler);
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
// @param enablePersistedQueries  Boolean specifying whether to perform query mapping. If set to
// `false`, this middleware will just send the GraphQL document strings like a normal network
// interface.
//
// @param lookupErrorHandler  An Express handler that is called when a query cannot be
// found in the query map. Only relevant if in ap roduction environment.
export type QueryMapFunction = (queryId: (string | number)) => Promise<string>;
export function getMiddlewareForQueryMapFunction(
  queryMapFunc: QueryMapFunction,
  enablePersistedQueries: boolean = true,
  lookupErrorHandler?: Handler,
): Handler {
  // If we are not in a enablePersistedQueries environment, then we don't want to do any query mapping
  // and we move to the next request handler.
  if (!enablePersistedQueries) {
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
