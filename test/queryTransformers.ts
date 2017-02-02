import * as chai from 'chai';
const { assert } = chai;

import gql from 'graphql-tag';

import {
  print,
  DocumentNode,
} from 'graphql';

import {
  isOperationDefinition,
} from '../src/extractFromAST';

import {
  addTypenameTransformer,
} from '../src/queryTransformers';

describe('query transformers', () => {
  describe('typename query transformer', () => {
    const assertTransform = (inputQuery: DocumentNode, expected: DocumentNode) => {
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
  });
});
