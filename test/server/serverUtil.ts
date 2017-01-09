import * as chai from 'chai';
const { assert } = chai;

import gql from 'graphql-tag';

import {
  DocumentNode,
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
    const queryMapPath = 'test/fixtures/extracted_queries.json';
    it('should resolve the returned promise with something', (done) => {
      createPersistedQueryMiddleware('test/fixtures/extracted_queries.json').then((middleware) => {
        assert(middleware);
        done();
      });
    });

    it('should reject the promise in the event that the file cannot be found', (done) => {
      createPersistedQueryMiddleware('made-up-file-path.json').then((middleware) => {
        done(new Error('Returned a middleware instance when it should not have.'));
      }).catch((error) => {
        assert.include(error.message, 'ENOENT');
        done();
      });
    });

    it('returned middleware should be able to pass along query id', (done) => {
      const req = {
        id: '1',
        query: undefined as DocumentNode,
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

      createPersistedQueryMiddleware(queryMapPath).then((middleware) => {
        assert(middleware);
        const expressRequest = {
          body: req,
        };
        middleware(expressRequest as Request, null, next);
      });
    });

    it('returned middleware should call the error handler on unmatched query id', (done) => {
      const req = {
        id: 18,
        query: undefined as Document,
      };
      const next = () => {
        done(new Error('Called next() when it should have just errored and moved on.'));
      };
      const errorHandler = () => {
        done();
      };
      createPersistedQueryMiddleware(queryMapPath, true, errorHandler).then((middleware) => {
        assert(middleware);
        const expressRequest = { body: req };
        middleware(expressRequest as Request, null, next);
      });
    });

    it('returned middleware should call the error handler on undefined query id', (done) => {
      const req = {
        id: undefined as number,
        query: undefined as Document,
      };
      const next = () => {
        done(new Error('Called next when it should have errored.'));
      };
      const errorHandler = () => {
        done();
      };
      createPersistedQueryMiddleware(queryMapPath, true, errorHandler).then((middleware) => {
        assert(middleware);
        const expressRequest = { body: req };
        middleware(expressRequest as Request, null, next);
      });
    });
  });
});
