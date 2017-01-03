import {
  Field,
  SelectionSet,
  Document,
  print,
} from 'graphql';

import {
  QueryTransformer,
} from './common';

import {
  isField,
  isInlineFragment,
  isOperationDefinition,
  isFragmentDefinition,
} from './extractFromAST';

const _ = require('lodash');

// TODO Most of this implementation has been copped from here:
// https://github.com/apollostack/apollo-client/blob/master/src/queries/queryTransform.ts
//
// This probably means that this implementation should be exported as some kind of library,
// along with some of the other AST-related stuff implemented for apollo-client.
const TYPENAME_FIELD: Field = {
  kind: 'Field',
  alias: null,
  name: {
    kind: 'Name',
    value: '__typename',
  },
};

// Query transformer that adds a `__typename` field to every level of the document.
export const addTypenameTransformer: QueryTransformer = (document: Document) => {
  const docClone: Document = _.cloneDeep(document);
  docClone.definitions.forEach((definition) => {
    if (isOperationDefinition(definition) || isFragmentDefinition(definition)) {
      addTypenameToSelectionSet(definition.selectionSet, true);
    }
  });
  return docClone;
};

// Internal function that adds a `__typename` field to every level of a given selection set.
function addTypenameToSelectionSet(
  selectionSet: SelectionSet,
  isRoot = false,
) {
  if (selectionSet && selectionSet.selections) {
    if (! isRoot) {
      const alreadyHasThisField = selectionSet.selections.some((selection) => {
        return isField(selection) && (selection as Field).name.value === '__typename';
      });

      if (! alreadyHasThisField) {
        selectionSet.selections.push(TYPENAME_FIELD);
      }
    }

    selectionSet.selections.forEach((selection) => {
      if (isField(selection) || isInlineFragment(selection)) {
        addTypenameToSelectionSet(selection.selectionSet);
      }
    });
  }
}
