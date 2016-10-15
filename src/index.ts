import fs = require('fs');
import path = require('path');

// TODO figure out how graphql-tag/parser is supposed to be imported
// and use that instead of the graphql package.
import { 
  parse,
} from 'graphql';

export class ExtractGQL {
  public inputFilePath: string;
  public outputFilePath: string;

  // Given a file path, this returns the extension of the file within the
  // file path.
  public static getFileExtension(filePath: string): string {
    const pieces = path.basename(filePath).split('.');
    if (pieces.length <= 1) {
      return "";
    }
    return pieces[pieces.length - 1];
  }

  // Reads a file into a string.
  public static readFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if(err) {
          console.log('Error: ', err);
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

  public processGraphQLFile(graphQLFile: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {

    });
  }

  public processInputFile(inputFile: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const extension = ExtractGQL.getFileExtension(inputFile);
      switch(extension) {
        case 'graphql':
        this.processGraphQLFile(inputFile);
        break;

        default:
        resolve(false);
        break;
      }
    });
  } 

  // Processes an input path, which may be a path to a GraphQL file,
  // a TypeScript file or a Javascript file. Returns a map going from
  // a hash to a query document.
  public processInputPath(inputPath: string): Promise<boolean> {
    return new Promise<void>((resolve, reject) => {
      if (ExtractGQL.isDirectory(inputPath)) {
        // TODO recurse over the files in this directory
      } else {
        this.processInputFile(inputPath);
      }
    });
  }

  // Extracts GraphQL queries from this.inputFilePath and produces
  // an output JSON file in this.outputFilePath.
  public extract() {
    this.processInputPath(this.inputFilePath);
  }
}
