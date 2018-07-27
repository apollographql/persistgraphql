# PersistGraphQL

`persistgraphql` has been deprecated in favor of [`apollo-link-persisted-queries`](https://github.com/apollographql/apollo-link-persisted-queries) and [`apollo-cli`](https://github.com/apollographql/apollo-cli). [Persisted queries](https://www.apollographql.com/docs/guides/performance.html#automatic-persisted-queries) can automatically used with Apollo Client and Server. To extract queries, use the cli and a command such as:

```
apollo codegen:generate --schema=schema.json --queries="test.graphql" queries.json
```
