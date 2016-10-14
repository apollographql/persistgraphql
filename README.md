# GraphQL Query Whitelisting

This will be a simple build tool that enables query whitelisting for projects that use statically analyze-able GraphQL queries.

It scans a code directory and extracts GraphQL query documents from both `.graphql` files as well as queries contained in 
Javascript/Typescript files within a `gql` tag. It then assigns these queries ID values/hashes and produces a JSON file which maps
from queries to hashes/IDs. This map can then be used by the client and server to perform query whitelisting, query lookups (i.e. 
client only sends the hash/id, the server just looks up the corresponding query), etc.