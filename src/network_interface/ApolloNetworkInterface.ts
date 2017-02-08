import { ExecutionResult } from 'graphql';
import {
  Request,
  NetworkInterface,
} from 'apollo-client/transport/networkInterface';

import {
  getQueryDocumentKey,
  OutputMap,
} from '../common';

export function addPersistedQueries(networkInterface: NetworkInterface, queryMap: OutputMap) {
  const _query = networkInterface.query;
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
