import {
  Document,
  Definition,
  OperationDefinition,
} from 'graphql';

// Checks if a given GraphQL definition is an operation definition (i.e. either query or mutation).
export function isOperationDefinition(defn: Definition): defn is OperationDefinition {
  return (defn.kind === 'OperationDefinition');
}

export function isQueryDefinition(defn: Definition): defn is OperationDefinition {
  return (isOperationDefinition(defn) && defn.operation === 'query');
}

// A set of utilities that operate on GraphQL documents
// and let us extract stuff from these documents.
export function getQueryDefinitions(doc: Document): OperationDefinition[] {
  const queryDefinitions: OperationDefinition[] = [];
  doc.definitions.forEach((definition) => {
    if (isQueryDefinition(definition)) {
      queryDefinitions.push(definition);
    }
  });
  return queryDefinitions;
}
