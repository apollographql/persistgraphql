import * as chai from 'chai';
const { assert } = chai;

import {
  sortFragmentsByName,
} '../src/common.ts';

describe('common methods', () => {
  describe('sortFragmentsByName', () => {
    const query1 = gql`
      query { field }
    `;
    const query2 = gql`
      query { root }
    `;
    const fragment1 = gql`
      fragment details on Author {
        name
      }`;
    const fragment2 = gql`
      fragment info on Author {
        name {
          firstName
          lastName
        }  
      }`;
    it('should return 0 if either argument is not a fragment', () => {
      assert.equal(
        sortFragmentsByName(query1, query2),
        0,
      );

      assert.equal(
        sortFragmentsByName(fragment1, query2),
        0,
      );

      assert.equal(
        sortFragments(query1, fragment2),
        0
      );
    });

    
  });
});     
