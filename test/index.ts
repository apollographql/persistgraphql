import * as chai from 'chai';
const { assert } = chai;

import { ExtractGQL } from '../src/index';

describe('ExtractGQL', () => {
  it('should be able to construct an instance', () => {
    assert.doesNotThrow(() => {
      new ExtractGQL({
        inputFilePath: 'queries.graphql',
        outputFilePath: 'output.json',
      });
    });
  });

  describe('isDirectory', () => {
    it('should return true on a directory', (done) => {
      ExtractGQL.isDirectory('./test/fixtures').then((result) => {
        assert(result);
        done();
      });
    });

    it('should return false on a file', (done) => {
      ExtractGQL.isDirectory('./test/fixtures/queries.graphql').then((result) => {
        assert(!result);
        done();
      });
    });
  });
});
