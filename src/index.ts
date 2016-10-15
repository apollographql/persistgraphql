import fs = require('fs');

export interface OutputMap {

}

export class ExtractGQL {
  public inputFilePath: string;
  public outputFilePath: string;

  // Given a file path, this returns the extension of the file within the
  // file path.
  public static getFileExtension() {
    // pass
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
  // Processes an input path, which may be a path to a GraphQL file,
  // a TypeScript file or a Javascript file. Returns a map going from
  // a hash to a query document.
  public processInputPath() {
    // pass 
  }

  // Extracts GraphQL queries from this.inputFilePath and produces
  // an output JSON file in this.outputFilePath.
  public extract() {
    this.processInputPath();
  }
}
