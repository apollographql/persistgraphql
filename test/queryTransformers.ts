import * as chai from 'chai';
const { assert } = chai;

import gql from 'graphql-tag';

import {
  print,
  Document,
} from 'graphql';

import {
  isOperationDefinition,
} from '../src/extractFromAST';

import {
  addTypenameTransformer,
} from '../src/queryTransformers';

describe('query transformers', () => {
  describe('typename query transformer', () => {
    const assertTransform = (inputQuery: Document, expected: Document) => {
      assert.equal(
        print(addTypenameTransformer(inputQuery)),
        print(expected)
      );
    };

    it('should add __typename to all the levels of a simple query', () => {
      assertTransform(
        gql`
        query {
          author {
            firstName
            lastName
          }
        }`,
        gql`
        query {
          author {
            firstName
            lastName
            __typename
          }
        }`);
    });

    it('should add __typename to a multiple level nested query with inlined fragments', () => {
      assertTransform(gql`
        query {
          person {
            name {
              ... on Name {
                firstName
                lastName
              }
            }
            address {
              ... on Address {
                zipcode
              }
            }
          }
       }`,
       gql`
       query {
          person {
            name {
              ... on Name {
                firstName
                lastName
                __typename
              }
              __typename
            }
            address {
              ... on Address {
                zipcode
                __typename
              }
              __typename
            }
            __typename
         }
       }`);

    });

    it('should not add __typename to top-level fragments', () => {
      assertTransform(gql`
        query {
          author {
            ...details
          }
        }
        fragment details on Author {
          firstName
          lastName
        }`,
        gql`
        query {
          author {
            ...details
            __typename
          }
        }
        fragment details on Author {
          firstName
          lastName
        }`);
    });

    it('should add __typename to inner fragment fields', () => {
      assertTransform(gql`
       query {
         author {
           ...details
         }

         books {
           ...bookDetails
         }
       }
       fragment details on Author {
         name {
           firstName
           lastName
         }
       }
       fragment bookDetails on Book {
         publisher {
           name
         }
       }`,
       gql`
       query {
         author {
           ...details
           __typename
         }

         books {
           ...bookDetails
           __typename
         }
       }
       fragment details on Author {
         name {
           firstName
           lastName
           __typename
         }
       }
       fragment bookDetails on Book {
         publisher {
           name
           __typename
         }
      }`);
    });
  });
});
