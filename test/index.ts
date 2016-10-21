import * as chai from 'chai';
const { assert } = chai;

import { ExtractGQL } from '../src/index';
import { parse, print } from 'graphql';
import gql from 'graphql-tag';

describe('ExtractGQL', () => {
  const queries = gql`
    query {
      author {
        firstName
        lastName
      }
    }

    query otherQuery {
      person {
        firstName
        lastName
      }
    }`;

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
      ExtractGQL.isDirectory('./test/fixtures').then((result: boolean) => {
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

  describe('getFileExtension', () => {
    it('should return the correct extension on a file with an extension', () => {
      assert.equal(ExtractGQL.getFileExtension('../../path/source.graphql'), 'graphql');
      assert.equal(ExtractGQL.getFileExtension('/some/complicated/path.with.dots/dots../view.js'), 'js');
    });
    it('should return an empty string if the file has no extension', () => {
      assert.equal(ExtractGQL.getFileExtension('/redherring.graphql/file'), '');
      assert.equal(ExtractGQL.getFileExtension('file'), '');
    });
  });

  describe('readFile', () => {
    it('should be able to read a file into a string', (done) => {
      const filePath = 'test/fixtures/queries.graphql';
      ExtractGQL.readFile(filePath).then((result) => {
        const graphQLString = print(parse(result));
        assert.deepEqual(graphQLString, print(queries));
        done();
      });
    });
  });

  describe('createMapFromDocument', () => {
    const egql = new ExtractGQL({ inputFilePath: 'no_file.txt'});

    it('should be able to handle a document with no queries', () => {
      const document = gql`mutation something { otherThing }`;
      const map = egql.createMapFromDocument(document);
      assert.deepEqual(map, {});
    });

    it('should be able to handle a document with a single query', () => {
      const document = gql`query author {
        name
      }`;
      const map = egql.createMapFromDocument(document);
      assert.deepEqual(map, {
        [egql.getQueryKey(document.definitions[0])]: document.definitions[0],
      });
    });

    it('should be able to handle a document with multiple queries', () => {
      const document = gql`query author {
        name
      }
      query person {
        name
      }`;
      const map = egql.createMapFromDocument(document);
      assert.deepEqual(map, {
        [egql.getQueryKey(document.definitions[0])]: document.definitions[0],
        [egql.getQueryKey(document.definitions[1])]: document.definitions[1],
      });
    });
  });

  describe('processGraphQLFile', () => {
    it('should be able to load a GraphQL file with multiple queries', (done) => {
      const egql = new ExtractGQL({ inputFilePath: 'not-afile'});
      egql.processGraphQLFile('./test/fixtures/queries.graphql').then((documentMap) => {
        assert.equal(Object.keys(documentMap).length, 2);
        done();
      });
    });
  });
});
