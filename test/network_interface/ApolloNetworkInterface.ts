import * as chai from 'chai';
const { assert } = chai;

import gql from 'graphql-tag';
const _ = require('lodash');

import {
  Request,
  NetworkInterface,
} from 'apollo-client/transport/networkInterface';

import {
  addPersistedQueries,
} from '../../src/network_interface/ApolloNetworkInterface';

import {
  ExtractGQL,
} from '../../src/ExtractGQL';

import {
  getQueryDocumentKey,
} from '../../src/common';

describe('addPersistedQueries', () => {
  class GenericNetworkInterface implements NetworkInterface {
    public query(originalQuery: Request) {
      return Promise.resolve(originalQuery);
    }
  }

  const egql = new ExtractGQL({ inputFilePath: 'nothing' });
  const queriesDocument = gql`
    query {
      author {
        firstName
        lastName
      }
    }
  `;

  const queryMap = egql.createMapFromDocument(queriesDocument);

  const request = {
    query: gql`
      query {
        author {
          firstName
          lastName
        }
      }
    `,
  };

  it('should error with an unmapped query', (done) => {
    const networkInterface = new GenericNetworkInterface();
    addPersistedQueries(networkInterface, {});
    networkInterface.query(request).then(() => {
      done(new Error('Should not resolve'));
    }).catch((err) => {
      assert(err);
      assert.include(err.message, 'Could not find');
      done();
    });
  });

  it('should return a query with the persisted query id', () => {
    const networkInterface = new GenericNetworkInterface();
    addPersistedQueries(networkInterface, queryMap);
    const expectedId = queryMap[getQueryDocumentKey(request.query)];
    return networkInterface.query(request).then((persistedQuery) => {
      const id = _.get(persistedQuery, 'id');
      assert(id === expectedId, 'returned query id should equal expected document key');
    });
  });
});
