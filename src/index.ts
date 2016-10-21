import fs = require('fs');
import path = require('path');

// TODO figure out how graphql-tag/parser is supposed to be imported
// and use that instead of the graphql package.
import {
  parse,
  Document,
  OperationDefinition,
  print,
} from 'graphql';

import {
  getQueryDefinitions,
} from './extractFromAST';

// A map from a key (id or a hash) to a GraphQL document.
// TODO fix the "any" here and replace with a GraphQL document type.
export interface OutputMap {
  [key: string]: OperationDefinition;
}

export class ExtractGQL {
  public inputFilePath: string;
  public outputFilePath: string;

  // Given a file path, this returns the extension of the file within the
  // file path.
  public static getFileExtension(filePath: string): string {
    const pieces = path.basename(filePath).split('.');
    if (pieces.length <= 1) {
      return '';
    }
    return pieces[pieces.length - 1];
  }

  // Reads a file into a string.
  public static readFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  // Checks if a given path points to a directory.
  public static isDirectory(path: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      fs.stat(path, (err, stats) => {
        if (err) {
          reject(err);
        } else {
          resolve(stats.isDirectory());
        }
      });
    });
  }

  constructor({
    inputFilePath,
    outputFilePath = 'extracted_queries.json',
  }: {
    inputFilePath: string,
    outputFilePath?: string,
  }) {
    this.inputFilePath = inputFilePath;
    this.outputFilePath = outputFilePath;
  }

  // Create an OutputMap from a GraphQL document that may contain
  // queries, mutations and fragments.
  public createMapFromDocument(document: Document): OutputMap {
    const queryDefinitions = getQueryDefinitions(document);
    const result: OutputMap = {};
    queryDefinitions.forEach((definition) => {
      const queryKey = this.getQueryKey(definition);
      result[queryKey] = definition;
    });
    return result;
  }

  // Given the path to a particular `.graphql` file, read it, extract the queries
  // and return the promise to an OutputMap.
  public processGraphQLFile(graphQLFile: string): Promise<OutputMap> {
    return new Promise<OutputMap>((resolve, reject) => {
      ExtractGQL.readFile(graphQLFile).then((fileContents) => {
        const graphQLDocument = parse(fileContents);

        resolve(this.createMapFromDocument(graphQLDocument));
      });
    });
  }

  public processInputFile(inputFile: string): Promise<OutputMap> {
    return new Promise<OutputMap>((resolve, reject) => {
      const extension = ExtractGQL.getFileExtension(inputFile);
      switch (extension) {
        case 'graphql':
        resolve(this.processGraphQLFile(inputFile));
        break;

        default:
        reject(new Error('Unknown exception given.'));
        break;
      }
    });
  }

  // Processes an input path, which may be a path to a GraphQL file,
  // a TypeScript file or a Javascript file. Returns a map going from
  // a hash to a query document.
  public processInputPath(inputPath: string): Promise<OutputMap> {
    return new Promise<OutputMap>((resolve, reject) => {
      if (ExtractGQL.isDirectory(inputPath)) {
        // TODO recurse over the files in this directory
      } else {
        this.processInputFile(inputPath).then((outputMap: OutputMap) => {
          resolve(outputMap);
        });
      }
    });
  }

  // Returns a key for a query. Currently just uses GraphQL printing as a serialization
  // mechanism; may use hashes or ids in the future.
  public  getQueryKey(definition: OperationDefinition): string {
    return print(definition);
  }

  // Extracts GraphQL queries from this.inputFilePath and produces
  // an output JSON file in this.outputFilePath.
  public extract() {
    this.processInputPath(this.inputFilePath);
  }
}
