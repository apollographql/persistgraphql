import firstName from './fragment.gql';
import lastName from './fragment.graphql';

const query = gql`
query {
  author {
    ...firstName
    ...lastName
  }
}

${firstName}
${lastName}
`;
