import * as chai from 'chai';
const { assert } = chai;

import gql from 'graphql-tag';

import {
  PersistedQueryNetworkInterface,
} from '../../src/network_interface/ApolloNetworkInterface';

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
});
