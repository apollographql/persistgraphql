import * as chai from 'chai';
const { assert } = chai;

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
});
