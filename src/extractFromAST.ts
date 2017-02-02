import {
  DocumentNode,
  DefinitionNode,
  OperationDefinitionNode,
  SelectionSetNode,
  SelectionNode,
  FragmentSpreadNode,
  FieldNode,
  InlineFragmentNode,
  FragmentDefinitionNode,
} from 'graphql';

import _ = require('lodash');

// Checks if a given GraphQL definition is an operation definition (i.e. either query or mutation).
export function isOperationDefinition(defn: DefinitionNode): defn is OperationDefinitionNode {
  return (defn.kind === 'OperationDefinition');
}

// Checks if a given GraphQL selection is a FragmentSpread.
export function isFragmentSpread(selection: SelectionNode): selection is FragmentSpreadNode {
  return (selection.kind === 'FragmentSpread');
}

// Checks if a given GraphQL definition is a FragmentDefinition.
export function isFragmentDefinition(selection: DefinitionNode): selection is FragmentDefinitionNode {
  return (selection.kind === 'FragmentDefinition');
}

// Checks if a given GraphQL selection is a Field.
export function isField(selection: SelectionNode): selection is FieldNode {
  return (selection.kind === 'Field');
}

// Checks if a given GraphQL selection is an InlineFragment.
export function isInlineFragment(selection: SelectionNode): selection is InlineFragmentNode {
  return (selection.kind === 'InlineFragment');
}

export function isQueryDefinition(defn: DefinitionNode): defn is OperationDefinitionNode {
  return (isOperationDefinition(defn) && defn.operation === 'query');
}

// Creates a query document out of a single query operation definition.
export function createDocumentFromQuery(definition: OperationDefinitionNode): DocumentNode {
  return {
    kind: 'Document',
    definitions: [ definition ],
  };
}

// Get query definitions from query document.
export function getQueryDefinitions(doc: DocumentNode): OperationDefinitionNode[] {
  const queryDefinitions: OperationDefinitionNode[] = [];
  doc.definitions.forEach((definition) => {
    if (isQueryDefinition(definition)) {
      queryDefinitions.push(definition);
    }
  });
  return queryDefinitions;
}

export function getOperationDefinitions(doc: DocumentNode): OperationDefinitionNode[] {
  return doc.definitions.filter(isOperationDefinition) as OperationDefinitionNode[];
}

// Extracts the names of fragments from a SelectionSet recursively, given a document in which
// each of the fragments defined are given. Returns a map going from
// the name of fragment to the integer "1" to support O(1) lookups.
export function getFragmentNames(selectionSet: SelectionSetNode, document: DocumentNode): {
  [name: string]: number,
} {
  if (!selectionSet) {
    return {};
  }

  // Construct a map going from the name of a fragment to the definition of the fragment.
  const fragmentDefinitions: { [name: string]: FragmentDefinitionNode } = {};
  document.definitions.forEach((definition) => {
    if (isFragmentDefinition(definition)) {
      fragmentDefinitions[definition.name.value] = definition;
    }
  });

  let fragmentNames: { [name: string]: number } = {};
  selectionSet.selections.forEach((selection) => {
    // If we encounter a fragment spread, we look inside it to unravel more fragment names.
    if (isFragmentSpread(selection)) {
      fragmentNames[selection.name.value] = 1;
      const innerFragmentNames = getFragmentNames(
        fragmentDefinitions[selection.name.value].selectionSet,
        document
      );
      fragmentNames = _.merge(fragmentNames, innerFragmentNames);
    } else if (isInlineFragment(selection) || isField(selection)) {
      const innerFragmentNames = getFragmentNames(selection.selectionSet, document);
      fragmentNames = _.merge(fragmentNames, innerFragmentNames);
    }
  });
  return fragmentNames;
}
