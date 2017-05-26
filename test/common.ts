import * as chai from 'chai';
const { assert } = chai;

import {
  sortFragmentsByName,
  applyFragmentDefinitionSort,
} from '../src/common';

import {
  print,
} from 'graphql';

import gql from 'graphql-tag';

describe('common methods', () => {
  describe('sortFragmentsByName', () => {
    const queryDoc1 = gql`
      query { field }
    `;
    const queryDoc2 = gql`
      query { root }
    `;
    const fragmentDoc1 = gql`
      fragment details on Author {
        name
      }`;
    const fragmentDoc2 = gql`
      fragment info on Author {
        name {
          firstName
          lastName
        }  
      }`;
    const queryDef1 = queryDoc1.definitions[0];
    const queryDef2 = queryDoc2.definitions[0];
    const fragmentDef1 = fragmentDoc1.definitions[0];
    const fragmentDef2 = fragmentDoc2.definitions[0];
    
    it('should return 0 if both args are not a fragment', () => {
      assert.equal(
        sortFragmentsByName(queryDef1, queryDef2),
        0,
      );
    });

    it('should return 1 if the first arg is a fragment and the second isn not', () => {
      assert.equal(
        sortFragmentsByName(fragmentDef1, queryDef1),
        1
      );
    });

    it('should return -1 if the second arg is a fragment and the first arg is not', () => {
      assert.equal(
        sortFragmentsByName(queryDef2, fragmentDef2),
        -1
      );
    });

    it('correctly orders fragments by name', () => {
      assert.equal(
        sortFragmentsByName(fragmentDef1, fragmentDef2),
        -1
      );

      assert.equal(
        sortFragmentsByName(fragmentDef2, fragmentDef1),
        1
      );
    });
  });

  describe('applyFragmentDefinitionSort', () => {
    it('leaves presorted doc unaltered', () => {
      const doc = gql` 
        query { root }
        fragment details on Author { name }`;
      assert.equal(
        applyFragmentDefinitionSort(doc),
        doc
      );
    });
    
    it('moves fragment defintions to the end of the doc', () => {
      const doc = gql`
        fragment details on Author { name }
        query { root }`;
      const result = gql`
        query { root }
        fragment details on Author { name }`;

      assert.deepEqual(
        print(applyFragmentDefinitionSort(doc)),
        print(result),
      );
    });

    it('sorts fragments and moves them to the end of the doc', () => {
      const doc = gql`
        fragment d on Author { x } 
        fragment b on Author { x }
        fragment c on Author { x } 
        fragment a on Author { x }
        query { 
          ...a
          ...b
          ...c
          ...d
        }`;
      const result = gql`
        query { 
          ...a
          ...b
          ...c
          ...d
        }
        fragment a on Author { x }
        fragment b on Author { x }
        fragment c on Author { x } 
        fragment d on Author { x }`;
      assert.equal(
        print(applyFragmentDefinitionSort(doc)),
        print(doc)
      );
    });
  });
});     
