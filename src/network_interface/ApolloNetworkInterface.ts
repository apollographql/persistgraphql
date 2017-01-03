import {
  HTTPFetchNetworkInterface,
  RequestAndOptions,
} from 'apollo-client/transport/networkInterface';

import {
  getQueryKey,
  OutputMap,
} from '../common';

import { getQueryDefinitions } from '../extractFromAST';
const _ = require('lodash');

export class PersistedQueryNetworkInterface extends HTTPFetchNetworkInterface {
  public queryMap: OutputMap = {};
  public _opts: RequestInit;
  public _uri: string;

  constructor({
    uri,
    queryMap,
    opts = {},
  }: {
    uri: string,
    queryMap: OutputMap,
    opts?: RequestInit,
  }) {
    super(uri, opts);
    this._uri = uri;
    this._opts = opts;
    this.queryMap = queryMap;
  }

  // Overriden function from HTTPFetchNetworkInterface. Instead of sending down the entire
  // query document to the server, this will only send down the id of the query
  // from the query OutputMap.
  public fetchFromRemoteEndpoint({
    request,
    options,
  }: RequestAndOptions): Promise<IResponse> {
    const queryDocument = request.query;
    const queryDefinitions = getQueryDefinitions(queryDocument);
    if (queryDefinitions.length !== 1) {
      throw new Error('Multiple queries in a single document.');
    }
    
    const queryKey = getQueryKey(queryDefinitions[0]);
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
