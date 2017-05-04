import * as chai from 'chai';
const { assert } = chai;

import {
  ExecutionResult,
  print,
} from 'graphql';

import gql from 'graphql-tag';
import * as fetchMock from 'fetch-mock';
const _ = require('lodash');

import {
  parse,
} from 'graphql';

import {
  NetworkInterface,
  Request,
} from 'apollo-client/transport/networkInterface';

import {
  getQueryDocumentKey,
} from '../../src/common';

import {
  PersistedQueryNetworkInterface,
  addPersistedQueries,
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

  it('should not use query mapping when enablePersistedQueries = false', (done) => {
    const fetchUri = 'http://fake.com/fake';
    const query = gql`query { author }`;

    fetchMock.post(fetchUri, (url: string, opts: Object) => {
      const requestQuery =  parse(JSON.parse((opts as RequestInit).body.toString()).query);
      assert.equal(print(requestQuery), print(query));
      fetchMock.restore();
      done();
      return null;
    });

    const pni = new PersistedQueryNetworkInterface({
      uri: fetchUri,
      queryMap: {},
      enablePersistedQueries: false,
    });
    pni.query({ query });
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
      query {
        person(id: $id) {
          name
        }
      }
      query ListOfAuthors {
        author {
          firstName
          lastName
        }
      }
      mutation changeAuthorStuff {
        firstName
        lastName
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
      },
    };
    const fragmentQueryRequest = {
      id: 2,
    };
    const fragmentQueryData: Object = {
      person: {
        firstName: 'Jane',
        lastName: 'Smith',
      },
    };

    const errorQueryRequest = {
      id: 3,
    };
    const errorQueryData: Object = {
      house: {
        address: null,
      },
    };
    const errorQueryError = new Error('Could not compute error.');

    const idVariableValue = '1';
    const variableQueryRequest = {
      id: 4,
      variables: { id: idVariableValue },
    };
    const variableQueryData: Object = {
      person: {
        name: 'Dhaivat Pandya',
      },
    };
    const operationNameQueryRequest = {
      operationName: 'ListOfAuthors',
      id: 5,
    };
    const operationNameQueryData: Object = {
      author: [
        { name: 'Adam Smith' },
        { name: 'Thomas Piketty' },
      ],
    };

    const mutationRequest = {
      id: 6,
    };
    const mutationData = {
      firstName: 'John',
      lastName: 'Smith',
    };

    const queryMap = egql.createMapFromDocument(queriesDocument);
    const uri = 'http://fake.com/fakegraphql';
    const pni = new PersistedQueryNetworkInterface({
      uri,
      queryMap,
    });

    before(() => {
      fetchMock.post(uri, (url: string, opts: Object): ExecutionResult => {
        const receivedObject = JSON.parse((opts as RequestInit).body.toString());
        if (_.isEqual(receivedObject, simpleQueryRequest)) {
          return { data: simpleQueryData };
        } else if (_.isEqual(receivedObject, fragmentQueryRequest)) {
          return { data: fragmentQueryData };
        } else if (_.isEqual(receivedObject, errorQueryRequest)) {
          return { data: errorQueryData, errors: [ errorQueryError ] };
        } else if (_.isEqual(receivedObject, variableQueryRequest)) {
          return { data: variableQueryData };
        } else if (_.isEqual(receivedObject, operationNameQueryRequest)) {
          return { data: operationNameQueryData };
        } else if (_.isEqual(receivedObject, mutationRequest)) {
          return { data: mutationData };
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
        }`,
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
        `,
      }).then((result) => {
        assert.deepEqual(result.data, errorQueryData);
        assert.deepEqual(result.errors.length, 1);
        assert.deepEqual(result.errors[0], errorQueryError);
        done();
      });
    });

    it('should pass along variables to the server', (done) => {
      pni.query({
        query: gql`
          query {
            person(id: $id) {
              name
            }
          }`,
        variables: { id: idVariableValue },
      }).then((result) => {
        assert.deepEqual(result.data, variableQueryData);
        done();
      });
    });

    it('should pass along the operation name to the server', (done) => {
      pni.query({
        query: gql`
          query ListOfAuthors {
            author {
              firstName
              lastName
            }
          }`,
        operationName: 'ListOfAuthors',
      }).then((result) => {
        assert.deepEqual(result.data, operationNameQueryData);
        done();
      });
    });

    it('should also work with mutations', (done) => {
      pni.query({
        query: gql`
          mutation changeAuthorStuff {
            firstName
            lastName
          }`,
      }).then((result) => {
        assert.deepEqual(result.data, mutationData);
        done();
      });
    });
  });
});

describe('addPersistedQueries', () => {
  class GenericNetworkInterface implements NetworkInterface {
    public query(originalQuery: Request): Promise<ExecutionResult> {
      return Promise.resolve(originalQuery as ExecutionResult);
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
    variables: {
      id: '1',
    },
    operationName: '2',
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

  it('should pass through a query with the persisted query id', () => {
    type persistedQueryType = {
      id: string,
      variables: {
        id: string,
      },
      operationName: string,
    };

    const networkInterface = new GenericNetworkInterface();
    addPersistedQueries(networkInterface, queryMap);
    const expectedId = queryMap[getQueryDocumentKey(request.query)];
    return networkInterface.query(request).then((persistedQuery: persistedQueryType) => {
      const id = persistedQuery.id;
      const variables = persistedQuery.variables;
      const operationName = persistedQuery.operationName;
      assert(id === expectedId, 'returned query id should equal expected document key');
      assert(variables.id === '1', 'should pass through variables property');
      assert(operationName === '2', 'should pass through operation name');
    });
  });
});
