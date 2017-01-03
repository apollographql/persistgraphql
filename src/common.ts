// A set of things that are common across the CLI tool and the stuff that runs on the client/server
// (i.e. network interface, Express middleware, etc.)
//
// This file should not import any Node/server-specific modules.

import {
  OperationDefinition,
  Document,
  print,
} from 'graphql';
  
// A map from a key (id or a hash) to a GraphQL document.
export interface OutputMap {
  [key: string]: TransformedQueryWithId;
}

export interface TransformedQueryWithId {
  transformedQuery: Document;
  id: number | string;
}

export type QueryTransformer = (doc: Document) => Document;

// Apply queryTransformers to a query document.
export function applyQueryTransformers(
  document: Document,
  queryTransformers: QueryTransformer[] = []
): Document {
  let currentDocument = document;
  queryTransformers.forEach((transformer) => {
    currentDocument = transformer(currentDocument);
  });
  return currentDocument;
}

// Returns a key for a query operation definition. Currently just uses GraphQL printing as a
// serialization mechanism; may use hashes or ids in the future. Also applies the query
// transformers to the query definition before returning the key.
export function getQueryKey(
  definition: OperationDefinition,
  queryTransformers: QueryTransformer[] = [],
): string {
  const wrappingDocument: Document = {
    kind: 'Document',
    definitions: [ definition ],
  };
  return print(applyQueryTransformers(
    wrappingDocument,
    queryTransformers
  ).definitions[0]);
}

// Returns a key for a query in a document definition. Should include exactly one query and a set
// of fragments that the query references. Currently just uses GraphQL printing as a serialization
// mechanism; may use hashes or ids in the future. Also applies query transformers to the document
// before making it a document key.
export function getQueryDocumentKey(document: Document, definition: OperationDefinition): string {
  return print(this.applyQueryTransformers(this.trimDocumentForQuery(document, definition)));
}
