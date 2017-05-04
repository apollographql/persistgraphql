// A set of things that are common across the CLI tool and the stuff that runs on the client/server
// (i.e. network interface, Express middleware, etc.)
//
// This file should not import any Node/server-specific modules.

import {
  DefinitionNode,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  DocumentNode,
  print,
} from 'graphql';

// A map from a key (id or a hash) to a GraphQL document.
export interface OutputMap {
  [key: string]: QueryId;
}

export type QueryId = number | string;
export interface TransformedQueryWithId {
  transformedQuery: DocumentNode;
  id: number | string;
}

export type QueryTransformer = (doc: DocumentNode) => DocumentNode;

// Sorting strategy for fragment definitions. Sorts fragment
// definitions by their name and moves them to the end of the
// query.
export function sortFragmentsByName(a: DefinitionNode, b: DefinitionNode): number {
  const aIsFragment = a.kind === 'FragmentDefinition';
  const bIsFragment = b.kind === 'FragmentDefinition';

  // If both aren't fragments, just leave them in place.
  if (!aIsFragment && !bIsFragment) {
    return 0;
  }

  // If both are fragments, sort them by their name.
  if (aIsFragment && bIsFragment) {
    const aName = (a as (FragmentDefinitionNode)).name.value;
    const bName = (b as (FragmentDefinitionNode)).name.value;
    return aName.localeCompare(bName);
  }

  // Move fragments to the end.
  return aIsFragment ? 1 : -1;
}

// Apply sorting strategy for fragments.
export function applyFragmentDefinitionSort(document: DocumentNode): DocumentNode {
  document.definitions = document.definitions.sort(sortFragmentsByName);
  return document;
}

// Apply queryTransformers to a query document.
export function applyQueryTransformers(
  document: DocumentNode,
  queryTransformers: QueryTransformer[] = []
): DocumentNode {
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
  definition: OperationDefinitionNode,
  queryTransformers: QueryTransformer[] = [],
): string {
  const wrappingDocument: DocumentNode = {
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
export function getQueryDocumentKey(
  document: DocumentNode,
  queryTransformers: QueryTransformer[] = [],
): string {
  return print(applyFragmentDefinitionSort(applyQueryTransformers(document, queryTransformers)));
}
