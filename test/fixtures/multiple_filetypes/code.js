import lastName from './fragment.graphql';

const frag = gql`
fragment firstName on Author {
  firstName
}
`;

const query = gql`
query {
  author {
    ...firstName
    ...lastName
  }
}

${frag}
${lastName}
`;
