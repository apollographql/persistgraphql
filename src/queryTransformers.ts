import {
  FieldNode,
  SelectionSetNode,
  DefinitionNode,
  OperationDefinitionNode,
  DocumentNode,
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

import { cloneDeep } from 'lodash';

// TODO Most of this implementation has been copped from here:
// https://github.com/apollostack/apollo-client/blob/master/src/queries/queryTransform.ts
//
// This probably means that this implementation should be exported as some kind of library,
// along with some of the other AST-related stuff implemented for apollo-client.
const TYPENAME_FIELD: FieldNode = {
  kind: 'Field',
  alias: null,
  name: {
    kind: 'Name',
    value: '__typename',
  },
};

function addTypenameToSelectionSet(
  selectionSet: SelectionSetNode,
  isRoot = false,
) {
  if (selectionSet.selections) {
    if (! isRoot) {
      const alreadyHasThisField = selectionSet.selections.some((selection) => {
        return selection.kind === 'Field' && (selection as FieldNode).name.value === '__typename';
      });

      if (! alreadyHasThisField) {
        selectionSet.selections.push(TYPENAME_FIELD);
      }
    }

    selectionSet.selections.forEach((selection) => {
      if (selection.kind === 'Field' || selection.kind === 'InlineFragment') {
        if (selection.selectionSet) {
          addTypenameToSelectionSet(selection.selectionSet);
        }
      }
    });
  }
}

export const addTypenameTransformer: QueryTransformer = (doc: DocumentNode) => {
  const docClone = cloneDeep(doc);

  docClone.definitions.forEach((definition: DefinitionNode) => {
    const isRoot = definition.kind === 'OperationDefinition';
    addTypenameToSelectionSet((definition as OperationDefinitionNode).selectionSet, isRoot);
  });

  return docClone;
};
