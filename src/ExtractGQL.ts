import fs = require('fs');
import path = require('path');

import {
  parse,
  Document,
  OperationDefinition,
  print,
} from 'graphql';

import {
  getQueryDefinitions,
} from './extractFromAST';

import _ = require('lodash');

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

  // TODO add query transformers here
  public applyQueryTransformers(queryDefinition: OperationDefinition): OperationDefinition {
    return queryDefinition;
  }

  // Create an OutputMap from a GraphQL document that may contain
  // queries, mutations and fragments.
  public createMapFromDocument(document: Document): OutputMap {
    const queryDefinitions = getQueryDefinitions(document);
    const result: OutputMap = {};
    queryDefinitions.forEach((definition) => {
      const transformedQuery = this.applyQueryTransformers(definition);
      const queryKey = this.getQueryKey(transformedQuery);
      result[queryKey] = transformedQuery;
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
      ExtractGQL.isDirectory(inputPath).then((isDirectory) => {
        if (isDirectory) {
          // Recurse over the files within this directory.
          fs.readdir(inputPath, (err, items) => {
            if (err) {
              throw err;
            }
            const promises: Promise<OutputMap>[] = items.map((item) => {
              return this.processInputPath(inputPath + '/' + item);
            });

            Promise.all(promises).then((resultMaps: OutputMap[]) => {
              resolve(_.merge({} as OutputMap, ...resultMaps) as OutputMap);
            });
          });
          // TODO recurse over the files in this directory
        } else {
          this.processInputFile(inputPath).then((outputMap: OutputMap) => {
            resolve(outputMap);
          });
        }
      });
    });
  }

  // Returns a key for a query. Currently just uses GraphQL printing as a serialization
  // mechanism; may use hashes or ids in the future.
  public  getQueryKey(definition: OperationDefinition): string {
    return print(definition);
  }

  // Writes an OutputMap to a given file path.
  public writeOutputMap(outputMap: OutputMap, outputFilePath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.open(outputFilePath, 'w+', (openErr, fd) => {
        if (openErr) { reject(openErr); }
        fs.write(fd, JSON.stringify(outputMap), (writeErr, written, str) => {
          if (writeErr) { reject(writeErr); }
          resolve();
        });
      });
    });
  }

  // Extracts GraphQL queries from this.inputFilePath and produces
  // an output JSON file in this.outputFilePath.
  public extract() {
    this.processInputPath(this.inputFilePath).then((outputMap: OutputMap) => {
      this.writeOutputMap(outputMap, this.outputFilePath).then(() => {
        console.log(`Wrote output file to ${this.outputFilePath}.`);
      });
    });
  }
}

// Main driving method for the command line tool
export const main = (args: string[]) => {
  let inputFilePath: string;
  let outputFilePath: string;

  if (args.length < 1) {
    console.log('Usage: extractgql input_file [output_file]');
  } else if (args.length === 1) {
    inputFilePath = args[0];
  } else {
    inputFilePath = args[0];
    outputFilePath = args[1];
  }

  new ExtractGQL({
    inputFilePath: inputFilePath,
    outputFilePath: outputFilePath,
  }).extract();
};
