import * as chai from 'chai';
const { assert } = chai;

import { ExtractGQL } from '../src/index';

describe('ExtractGQL', () => {
  it('should be able to construct an instance', () => {
    assert.doesNotThrow(() => {
      new ExtractGQL();
    });
  });
});