import {
  Document,
  Definition,
  OperationDefinition,
  SelectionSet,
  Selection,
  FragmentSpread,
  Field,
  InlineFragment,
} from 'graphql';

import _ = require('lodash');

// Checks if a given GraphQL definition is an operation definition (i.e. either query or mutation).
export function isOperationDefinition(defn: Definition): defn is OperationDefinition {
  return (defn.kind === 'OperationDefinition');
}

// Checks if a given GraphQL selection is a FragmentSpread.
export function isFragmentSpread(selection: Selection): selection is FragmentSpread {
  return (selection.kind == 'FragmentSpread');
}

// Checks if a given GraphQL selection is a Field.
export function isField(selection: Selection): selection is Field {
  return (selection.kind == 'Field');
}

// Checks if a given GraphQL selection is an InlineFragment.
export function isInlineFragment(selection: Selection): selection is InlineFragment {
  return (selection.kind == 'InlineFragment');
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

export function getFragmentNames(selectionSet: SelectionSet): { [name: string]: number } {
  let fragmentNames: { [name: string]: number } = {};
  selectionSet.selections.forEach((selection) => {
    if (isFragmentSpread(selection)) {
      fragmentNames[selection.name.value] = 1;
    } else if(isInlineFragment(selection) || isField(selection)) {
      const innerFragmentNames = getFragmentNames(selection.selectionSet);
      fragmentNames = _.merge(fragmentNames, innerFragmentNames);
    }
  });
  return fragmentNames;
}
