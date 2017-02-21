import {
  HTTPFetchNetworkInterface,
  NetworkInterface,
  Request,
} from 'apollo-client';

import {
  ExecutionResult,
} from 'graphql';

import {
  getQueryDocumentKey,
  OutputMap,
} from '../common';

export class PersistedQueryNetworkInterface extends HTTPFetchNetworkInterface {
  public queryMap: OutputMap = {};
  public _opts: RequestInit;
  public _uri: string;
  public enablePersistedQueries: boolean;

  // Constructor for this class.
  //
  // @param enablePersistedQueries Determines whether or not to use persisted queries or just
  // send the query document string over the wire.
  //
  // @param uri URI of the GraphQL endpoint to which this network interface will send requests.
  //
  // @param queryMap The query map produced as output from the `extractgql` CLI tool.
  //
  // @param opts The set of options passed to fetch.
  constructor({
    enablePersistedQueries = true,
    uri,
    queryMap,
    opts = {},
  }: {
    enablePersistedQueries?: boolean,
    uri: string,
    queryMap: OutputMap,
    opts?: RequestInit,
  }) {
    super(uri, opts);
    this._uri = uri;
    this._opts = opts;
    this.queryMap = queryMap;
    this.enablePersistedQueries = enablePersistedQueries;

    if (enablePersistedQueries) {
      addPersistedQueries(this, queryMap);
    }
  }
}

export function addPersistedQueries(networkInterface: NetworkInterface, queryMap: OutputMap) {
  const _query = networkInterface.query.bind(networkInterface);

  return Object.assign(networkInterface, {
    query: (request: Request): Promise<ExecutionResult> => {
      const queryDocument = request.query;
      const queryKey = getQueryDocumentKey(queryDocument);

      if (!queryMap[queryKey]) {
        return Promise.reject(new Error('Could not find query inside query map.'));
      }

      const serverRequest = {
        id: queryMap[queryKey],
        variables: request.variables,
        operationName: request.operationName,
      };

      return _query(serverRequest);
    },
  });
}
