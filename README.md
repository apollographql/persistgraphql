# ExtractGQL

This will be a simple build tool that enables query whitelisting for projects that use statically analyze-able GraphQL queries.

It scans a code directory and extracts GraphQL query documents from both `.graphql` files as well as queries contained in
Javascript/Typescript files within a `gql` tag. It then assigns these queries ID values/hashes and produces a JSON file which maps
from queries to hashes/IDs. This map can then be used by the client and server to perform query whitelisting, query lookups (i.e.
client only sends the hash/id, the server just looks up the corresponding query), etc.

# Build Tool Semantics

The build tool will be called `extractgql`. Running it with no other arguments should give:

```
Usage: extractgql input_file [output file]
```

It can be called on a Javascript/Typescript file or a file containing GraphQL query definitions with extension `.graphql`:

```shell
extractgql index.js
extractgql index.ts
extractgql queries.graphql
```

It can also be called on a directory, which it will step through recursively:

```shell
extractgql src/
```

By default, the output will be palced in `extracted_queries.json`. An output file can be specified as the second argument:

```
extractgql index.ts output.json
```

# Progress
- Made Github Repo
- Wrote some of this README
- Wrote basic utility methods of `ExtractGQL`
- Filled out the basic structure of `ExtractGQL`
- Implemented the basic query extraction out of GraphQL files
- Added argument parsing
- Added output map construction from a query document
- Got it to the point where it can recursively step through a directory, extract queries out of `.graphql` files and
write an output JSON file from serialized query -> query