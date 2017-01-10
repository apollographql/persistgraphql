import * as chai from 'chai';
const { assert } = chai;

import {
  getQueryDefinitions,
  getFragmentNames,
} from '../src/extractFromAST';
import gql from 'graphql-tag';
import { print } from 'graphql';

describe('extractFromAST', () => {
  describe('getFragmentNames', () => {
    it('should extract the fragment names from top level references', () => {
      const document = gql`
        query {
          ...rootDetails
          ...otherRootDetails
        }
        fragment rootDetails on RootQuery {
          author {
            firstName
            lastName
          }
        }
        fragment otherRootDetails on RootQuery {
          author {
            firstName
            lastName
          }
        }
        `;
      const fragmentNames = getFragmentNames(document.definitions[0].selectionSet, document);
      assert.deepEqual(fragmentNames, {
        'rootDetails': 1,
        'otherRootDetails': 1,
      });
    });

    it('should extract the fragment names from deep references', () => {
      const document = gql`
        query {
          author {
            name {
              ...nameInfo
            }
            ...generalAuthorInfo
          }
        }
        fragment nameInfo on Name {
          firstName
          lastName
        }
        fragment generalAuthorInfo on Author {
          age
        }
      `;
      const fragmentNames = getFragmentNames(document.definitions[0].selectionSet, document);
      assert.deepEqual(fragmentNames, {
        nameInfo: 1,
        generalAuthorInfo: 1,
      });
    });

    it('should extract fragment names referenced in fragments', () => {
      const document = gql`
        query {
          author {
            name {
              ...nameInfo
            }
          }
        }
        fragment nameInfo on Name {
          firstName
          ...otherNameInfo
        }
        fragment otherNameInfo on Name {
          otherThing {
            lastName
          }
        }
      `;
      const fragmentNames = getFragmentNames(document.definitions[0].selectionSet, document);
      assert.deepEqual(fragmentNames, {
        nameInfo: 1,
        otherNameInfo: 1,
      });
    });
  });

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
  });
});
