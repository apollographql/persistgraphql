# PersistGraphQL

`persistgraphql` is a simple build tool that enables query whitelisting and persisted queries for GraphQL projects that use statically analyze-able GraphQL queries.

It scans a code directory and extracts GraphQL query documents from `.graphql` files. It then assigns these queries ID values/hashes and produces a JSON file which maps from queries to hashes/IDs. This map can then be used by the client and server to perform query whitelisting, query lookups (i.e. client only sends the hash/id, the server just looks up the corresponding query), etc.

The npm package also provides a network interface for [Apollo Client](https://github.com/apollostack/apollo-client) that manages the query lookups in `persistgraphql/lib/browser`. To see how to extract the queries on the server, see the [code snippets](#server-side) below.

# Installation
For only the CLI tool:

```shell
npm install -g persistgraphql
```

As a dependency (for Apollo Client network interface):

```shell
npm install --save persistgraphql
```

# Build Tool Semantics

The build tool binary is called `persistgraphql`. Running it with no other arguments should give:

```
Usage: persistgraphql input_file [output file] [--add_typename]
```

It can be called on a file containing GraphQL query definitions with extension `.graphql`:

```shell
persistgraphql queries.graphql
```

It can also be called on a directory, which it will step through recursively:

```shell
persistgraphql src/
```

By default, the output will be placed in `extracted_queries.json`. An output file can be specified as the second argument:

```
persistgraphql index.ts output.json
```

## Adding Typenames to Extracted Queries

It can also take the `--add_typename` flag which will apply a query transformation to the query documents, adding the `__typename` field at every level of the query. You must pass this option if your client code uses this query transformation.

```
persistgraphql src/ --add_typename
```

## Extracting Queries from TypeScript

To extract GraphQL queries from TypeScript files, use `--js --extension=ts`.

```
persistgraphql src/index.js --js --extension=ts
```

## Extracting Queries from JavaScript

It is also possible to extract GraphQL queries from JavaScript files using `--extension=js --js`.

```
persistgraphql src/index.js --js --extension=js
```

# Apollo Client Network Interface

This package provides an implementation of an Apollo Client network interface that provides persisted query support. It serves as a drop-in replacement for the standard network interface and uses the query map given by `persistgraphql` in order to send only query hashes/ids to the serverather than the query document.

This package also provides a way for you to alter any generic NetworkInterface to use persisted queries from a provided query map with the `addPersistedQueries(networkInterface: NetworkInterface, queryMap: OutputMap)` function.
This overrides the `query` member function of your network interface instance to replace your query with an id based on the query map provided.

See the implementation as well as some documentation for it within `src/network_interface/ApolloNetworkInterface.ts`.

# Server-side

If you use the client network interface provided by this package, you can quickly roll your own middleware to get the GraphQL query instead of the query ID that the network interface sends. Here's an example with Express using the `lodash` `invert` method:

```js
import queryMap from ‘../extracted_queries.json’;
import { invert } from 'lodash';
app.use(
  '/graphql',
  (req, resp, next) => {
    if (config.persistedQueries) {
      const invertedMap = invert(queryMap);
      req.body.query = invertedMap[req.body.id];
    }
    next();
  },
);
```
Here's an example with a Hapi server extension using the `lodash` `invert` method:

```js
import queryMap from ‘../extracted_queries.json’;
import { invert } from 'lodash';
server.ext('onPreHandler', (req: Request, reply) => {
  if (config.persistedQueries && req.url.path.indexOf('/graphql') >= 0 && req.payload.id) {
    const invertedMap = invert(queryMap);
    req.payload.query = invertedMap[req.payload.id]
  }
  return reply.continue();
});
```
