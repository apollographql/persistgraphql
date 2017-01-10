import {
  HTTPFetchNetworkInterface,
  RequestAndOptions,
} from 'apollo-client/transport/networkInterface';

import {
  getQueryKey,
  OutputMap,
} from '../common';

import { getOperationDefinitions } from '../extractFromAST';
const _ = require('lodash');

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
  }

  // Overriden function from HTTPFetchNetworkInterface. Instead of sending down the entire
  // query document to the server, this will only send down the id of the query
  // from the query OutputMap.
  public fetchFromRemoteEndpoint({
    request,
    options,
  }: RequestAndOptions): Promise<IResponse> {
    // If we are not in an enablePersistedQueries environment, this should just use the
    // standard network interface.
    if (!this.enablePersistedQueries) {
      return super.fetchFromRemoteEndpoint({ request, options });
    }
    
    const queryDocument = request.query;
    const operationDefinitions = getOperationDefinitions(queryDocument);
    if (operationDefinitions.length !== 1) {
      throw new Error('Multiple queries in a single document.');
    }
    
    const queryKey = getQueryKey(operationDefinitions[0]);
    if (!this.queryMap[queryKey]) {
      throw new Error('Could not find query inside query map.');
    }
    const serverRequest = {
      id: this.queryMap[queryKey].id,
      variables: request.variables,
      operationName: request.operationName,
    };
    return fetch(this._uri, _.assign({}, this._opts, {
      body: JSON.stringify(serverRequest),
      method: 'POST',
    }, options, {
      headers: _.assign({}, {
        Accept: '*/*',
        'Content-Type': 'application/json',
      }, options.headers),
    }));
  }
}
