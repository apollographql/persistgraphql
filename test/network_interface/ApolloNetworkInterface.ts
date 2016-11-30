import * as chai from 'chai';
const { assert } = chai;

import {
  GraphQLResult,
} from 'graphql';

import gql from 'graphql-tag';
import * as fetchMock from 'fetch-mock';
const _ = require('lodash');

import {
  PersistedQueryNetworkInterface,
} from '../../src/network_interface/ApolloNetworkInterface';

import {
  ExtractGQL,
} from '../../src/ExtractGQL';

describe('PersistedQueryNetworkInterface', () => {
  it('should construct itself', () => {
    const pni = new PersistedQueryNetworkInterface({
      uri: 'http://fake.com/fake',
      queryMap: {},
    });
    assert.equal(pni._uri, 'http://fake.com/fake');
    assert.deepEqual(pni._opts, {});
    assert.deepEqual(pni.queryMap, {});
  });

  it('should fail to work when asked to lookup nonmapped query', (done) => {
    const pni = new PersistedQueryNetworkInterface({
      uri: 'http://fake.com/fake',
      queryMap: {},
    });

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

    pni.query(request).then(() => {
      done(new Error('Result resolved when it should not have.'));
    }).catch((err: Error) => {
      assert(err);
      assert.include(err.message, 'Could not find');
      done();
    });
  });

  it('should fail to work when asked to process a query within multiple definitions', (done) => {
    const pni = new PersistedQueryNetworkInterface({
      uri: 'http://fake.com/fake',
      queryMap: {},
    });
    const request = {
      query: gql`
        query {
          author {
            firstName
          }
        }
        query {
          person {
            name
          }
        }
      `,
    };
    pni.query(request).then(() => {
      done(new Error('Result resolved when it should not have.'));
    }).catch((err: Error) => {
      assert(err);
      assert.include(err.message, 'Multiple queries');
      done();
    });
  });

  describe('sending query ids', () => {
    const egql = new ExtractGQL({ inputFilePath: 'nothing' });
    const queriesDocument = gql`
      query {
        author {
          firstName
          lastName
        }
      }
      query {
        person {
          ...personDetails
        }
      }
      query {
        house {
          address
        }
      }
      fragment personDetails on Person {
        firstName
        lastName
      }
    `;
    const simpleQueryRequest = {
      id: 1,
    };
    const simpleQueryData: Object = {
      author: {
        firstName: 'John',
        lastName: 'Smith',
      }
    };
    const fragmentQueryRequest = {
      id: 2,
    };
    const fragmentQueryData: Object = {
      person: {
        firstName: 'Jane',
        lastName: 'Smith',
      }
    };
    const errorQueryRequest = {
      id: 3,
    };
    const errorQueryData: Object = {
      house: {
        address: null,
      }
    };
    const errorQueryError = new Error('Could not compute error.');

    const queryMap = egql.createMapFromDocument(queriesDocument);
    const uri = 'http://fake.com/fakegraphql'
    const pni = new PersistedQueryNetworkInterface({
      uri,
      queryMap,
    });

    before(() => {
      fetchMock.post(uri, (url: string, opts: Object): GraphQLResult => {
        const receivedObject = JSON.parse((opts as RequestInit).body.toString());
        if (_.isEqual(receivedObject, simpleQueryRequest)) {
          return { data: simpleQueryData };
        } else if (_.isEqual(receivedObject, fragmentQueryRequest)) {
          return { data: fragmentQueryData };
        } else if (_.isEqual(receivedObject, errorQueryRequest)) {
          return { data: errorQueryData, errors: [ errorQueryError ] };
        } else {
          throw new Error('Received unmatched request in mock fetch.');
        }
      });
    });

    after(() => {
      fetchMock.restore();
    });

    it('should work for a single, no fragment query', (done) => {
      pni.query({
        query: gql`
        query {
          author {
            firstName
            lastName
          }
        }`
      }).then((result) => {
        assert.deepEqual(result.data, simpleQueryData);
        done();
      }).catch((error) => {
        done(error);
      });
    });

    it('should work for a query with a fragment', (done) => {
      pni.query({
        query: gql`
          query {
            person {
              ...personDetails
            }
          }

          fragment personDetails on Person {
            firstName
            lastName
          }
      `}).then((result) => {
        assert.deepEqual(result.data, fragmentQueryData);
        done();
      });
    });

    it('should work for a query that returns an error', (done) => {
      pni.query({
        query: gql`
          query {
            house {
              address
            }
          }
        `
      }).then((result) => {
        assert.deepEqual(result.data, errorQueryData);
        assert.deepEqual(result.errors.length, 1);
        assert.deepEqual(result.errors[0], errorQueryError);
        done();
      });
    });
  });
});
