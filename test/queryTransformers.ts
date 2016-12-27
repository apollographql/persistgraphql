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
      const inputDefinition = inputQuery.definitions[0];
      const expectedDefinition = expected.definitions[0];
      if (isOperationDefinition(inputDefinition)) {
        assert.equal(
          print(addTypenameTransformer(inputDefinition)),
          print(expectedDefinition)
        );
      } else {
        throw new Error('The first definition in the query was not an OperationDefinition.');
      }
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
