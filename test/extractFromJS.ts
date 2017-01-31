import * as chai from 'chai';
const { assert } = chai;

import {
  findTaggedTemplateLiteralsInJS,
  eliminateInterpolations,
} from '../src/extractFromJS';

import gql from 'graphql-tag';
import { print } from 'graphql';

describe('extractFromJS', () => {
  it('should be able to find tagged strings inside JS', () => {
    const jsFile = `
      // Single line
      const query = gql\`xxx\`;

      // Multi line
      const query2 = gql\`y
y
y\`;

      // Has a space before tag
      const query3 = gql \`zzz\`;
    `;

    assert.deepEqual(findTaggedTemplateLiteralsInJS(jsFile, 'gql'), [
      'xxx',
      'y\ny\ny',
      'zzz',
    ]);
  });

  it('should eliminate interpolations', () => {
    const contents = `
      {
        a { b ...c }
      }
\${c}
    `;

    assert.deepEqual(eliminateInterpolations(contents), `
      {
        a { b ...c }
      }

    `);
  });
});
