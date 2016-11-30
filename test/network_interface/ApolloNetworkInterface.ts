import * as chai from 'chai';
const { assert } = chai;

import gql from 'graphql-tag';
import * as fetchMock from 'fetch-mock';

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
      fragment personDetails on Person {
        firstName
        lastName
      }
    `;
    const simpleQueryRequest = {
      id: 1,
    };
    const simpleQueryResult: Object = {
      author: {
        firstName: 'John',
        lastName: 'Smith',
      }
    };
    const fragmentQueryRequest = {
      id: 2,
    };
    const fragmentQueryResult: Object = {
      person: {
        firstName: 'Jane',
        lastName: 'Smith',
      }
    };
    const queryMap = egql.createMapFromDocument(queriesDocument);
    const uri = 'http://fake.com/fakegraphql'
    const pni = new PersistedQueryNetworkInterface({
      uri,
      queryMap,
    });

    before(() => {
      fetchMock.post(uri, (url: string, opts: Object) => {
        const receivedObject = JSON.parse((opts as RequestInit).body.toString());
        if (assert.deepEqual(receivedObject, simpleQueryRequest)) {
          return simpleQueryResult;
        } else if (assert.deepEqual(receivedObject, fragmentQueryRequest)) {
          return fragmentQueryResult;
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
      });
    });
  });
});
