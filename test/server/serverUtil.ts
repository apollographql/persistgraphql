import * as chai from 'chai';
const { assert } = chai;

import gql from 'graphql-tag';

import {
  Document,
  print,
} from 'graphql';

import {
  createPersistedQueryMiddleware,
} from '../../src/server/serverUtil';

import {
  Request,
} from 'express';

describe('serverUtil', () => {
  describe('createPersistedQueryMiddleware', () => {
    it('it should resolve the returned promise with something', (done) => {
      createPersistedQueryMiddleware('test/fixtures/extracted_queries.json').then((middleware) => {
        assert(middleware);
        done();
      });
    });

    it('returned middleware should be able to pass along query id', (done) => {
      const req = {
        id: 1,
        query: undefined as Document,
      };
      const expectedQuery = gql`
        query {
          author {
            firstName
            lastName
          }
        }
      `;

      const next = () => {
        assert.deepEqual(req.query, print(expectedQuery));
        done();
      };

      createPersistedQueryMiddleware('test/fixtures/extracted_queries.json').then((middleware) => {
        assert(middleware);
        const expressRequest = {
          body: req,
        };
        middleware(expressRequest as Request, null, next);
      });

    });
  });

});
