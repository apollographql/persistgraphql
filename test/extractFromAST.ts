import * as chai from 'chai';
const { assert } = chai;

import { getQueryDefinitions } from '../src/extractFromAST';
import gql from 'graphql-tag';
import { print } from 'graphql';

describe('extractFromAST', () => {
  describe('getQueryDefinitions', () => {
    it('should extract query definitions out of a document containing multiple queries', () => {
      const document = gql`
        query {
          author {
            firstName
            lastName
          }
        }
        query {
          person {
            name
          }
        }
        mutation createRandomAuthor {
          name
        }`;
      const query1 = gql`
        query {
          author {
            firstName
            lastName
          }
        }
      `;
      const query2 = gql`
        query {
          person {
            name
          }
        }`;
      const queries = getQueryDefinitions(document);
      assert.equal(queries.length, 2);
      assert.equal(print(queries[0]), print(query1.definitions[0]));
      assert.equal(print(queries[1]), print(query2.definitions[0]));
    });
  })
});