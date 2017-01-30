# PersistGraphQL

`persistgraphql` is a simple build tool that enables query whitelisting and persisted queries for GraphQL projects that use statically analyze-able GraphQL queries.

It scans a code directory and extracts GraphQL query documents from `.graphql` files. It then assigns these queries ID values/hashes and produces a JSON file which maps from queries to hashes/IDs. This map can then be used by the client and server to perform query whitelisting, query lookups (i.e. client only sends the hash/id, the server just looks up the corresponding query), etc.

The npm package also provides a network interface for [Apollo Client](https://github.com/apollostack/apollo-client) that manages the query lookups in `persistgraphql/lib/browser` and middleware for Express servers in `persistgraphql/lib/server`. These will likely be moved to their own packages in the future to reduce bundle size.

# Installation
For only the CLI tool:

```
npm install -g persistgraphql
```

As a dependency (for Express middlware or Apollo Client network interface):

```
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

By default, the output will be palced in `extracted_queries.json`. An output file can be specified as the second argument:

```
persistgraphql index.ts output.json
```

It can also take the `--add_typename` flag which will apply a query transformation to the query documents, adding the `__typename` field at every level of the query. You must pass this option if your client code uses this query transformation. 

```
persistgraphql src/ --add_typename
```

# Apollo Client Network Interface

This package also provides an implementation of an Apollo Client network interface that provides persisted query support. It serves as a drop-in replacement for the standard network interface and uses the query map given by `persistgraphql` in order to send only query hashes/ids to the serverather than the query document. 

See the implementation as well as some documentation for it within `src/network_interface/ApolloNetworkInterface.ts`.

# Express middleware

This package also provides middleware for Express servers that maps a JSON object such as the following:

```
{
    id: < query id >,
    variables: < query variables >,
    operationName: < query operation name >
}
```

to the following:

```
{
    query: < query >,
    variables: < query variables >,
    operationName: < query operation name >
}
```

That is, it maps query ids to the query document using the query map given by `persistgraphql`. See `src/server/serverUtil.ts` for the middleware methods and some documentation.
