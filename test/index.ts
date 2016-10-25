import * as chai from 'chai';
const { assert } = chai;

import { ExtractGQL, OutputMap } from '../src/ExtractGQL';
import { parse, print, OperationDefinition } from 'graphql';
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
  const egql = new ExtractGQL({ inputFilePath: 'not-real'});
  const keys = [
    egql.getQueryKey(queries.definitions[0]),
    egql.getQueryKey(queries.definitions[1]),
  ];

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
    it('should be able to handle a document with no queries', () => {
      const document = gql`mutation something { otherThing }`;
      const map = egql.createMapFromDocument(document);
      assert.deepEqual(map, {});
    });

    it('should be able to handle a document with a single query', () => {
      const myegql = new ExtractGQL({ inputFilePath: 'nothing' });
      const document = gql`query author {
        name
      }`;
      const map = myegql.createMapFromDocument(document);
      assert.deepEqual(map, {
        [egql.getQueryKey(document.definitions[0])]: {
          transformedQuery: document.definitions[0],
          id: 1,
        },
      });
    });

    it('should be able to handle a document with multiple queries', () => {
      const myegql = new ExtractGQL({ inputFilePath: 'empty' });
      const document = gql`query author {
        name
      }
      query person {
        name
      }`;
      const map = myegql.createMapFromDocument(document);
      assert.deepEqual(map, {
        [egql.getQueryKey(document.definitions[0])]: {
          transformedQuery: document.definitions[0],
          id: 1,
        },
        [egql.getQueryKey(document.definitions[1])]: {
          transformedQuery: document.definitions[1],
          id: 2,
        },
      });
    });
  });

  describe('queryTransformers', () => {
    it('should be able to transform a document before writing it to the output map', () => {
      const originalDocument = gql`
        query {
          author {
            firstName
            lastName
          }
        }
      `;
      const newDocument = gql`
        query {
          person {
            name
          }
        }
      `;
      const queryTransformer = (queryDef: OperationDefinition) => {
        return newDocument.definitions[0];
      };
      const myegql = new ExtractGQL({ inputFilePath: 'empty' });
      myegql.addQueryTransformer(queryTransformer);
      const map = myegql.createMapFromDocument(originalDocument);
      assert.deepEqual(map, {
        [egql.getQueryKey(originalDocument.definitions[0])]: {
          id: 1,
          transformedQuery: newDocument.definitions[0],
        },
      });
    });
  });

  describe('processGraphQLFile', () => {
    it('should be able to load a GraphQL file with multiple queries', (done) => {
      egql.processGraphQLFile('./test/fixtures/queries.graphql').then((documentMap) => {
        assert.equal(Object.keys(documentMap).length, 2);
        done();
      });
    });
  });

  describe('processInputFile', () => {
    it('should not process a file with an unknown extension', (done) => {
      egql.processInputFile('./test/fixtures/bad.c').then((documentMap) => {
        done(new Error('Returned a result when it should not have.'));
      }).catch((error) => {
        assert(error);
        done();
      });
    });

    it('should correctly process a file with a .graphql extension', (done) => {
      egql.processInputFile('./test/fixtures/queries.graphql').then((result: OutputMap) => {
        assert.equal(Object.keys(result).length, 2);
        assert.equal(print(result[keys[0]].transformedQuery), print(queries.definitions[0]));
        assert.equal(print(result[keys[1]].transformedQuery), print(queries.definitions[1]));
        done();
      });
    });
  });

  describe('processInputPath', () => {
    it('should process a single file', (done) => {
      egql.processInputPath('./test/fixtures/queries.graphql').then((result: OutputMap) => {
        assert.equal(Object.keys(result).length, 2);
        assert.equal(print(result[keys[0]].transformedQuery), print(queries.definitions[0]));
        assert.equal(print(result[keys[1]].transformedQuery), print(queries.definitions[1]));
        done();
      });
    });

    it('should process a directory with a single file', (done) => {
      egql.processInputPath('./test/fixtures').then((result: OutputMap) => {
        assert.equal(Object.keys(result).length, 2);
        assert.equal(print(result[keys[0]].transformedQuery), print(queries.definitions[0]));
        assert.equal(print(result[keys[1]].transformedQuery), print(queries.definitions[1]));
        done();
      });
    });
  });

  describe('writeOutputMap', () => {
    it('should be able to write an OutputMap to a file', (done) => {
      const outputMap = egql.createMapFromDocument(queries);
      egql.writeOutputMap(outputMap, './test/output_tests/output.graphql').then(() => {
        done();
      }).catch((err) => {
        done(err);
      });
    });
  });
});
