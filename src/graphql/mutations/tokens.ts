export const API_TOKEN_GRANT_MUTATION = `
  mutation APITokenGrant($input: APITokenGrantInput!) {
    apiTokenGrant(input: $input) {
      error { message }
      token {
        id
        created
        expiration
        notes
        tokenString
        trustedIPAddresses
        persona { id name }
      }
    }
  }
`;

export const API_TOKEN_REVOKE_MUTATION = `
  mutation APITokenRevoke($id: ID!) {
    apiTokenRevoke(input: { id: $id }) {
      error { message }
    }
  }
`;

export const API_TOKEN_ROTATE_MUTATION = `
  mutation APITokenRotate($tokenString: String!) {
    apiTokenRotate(input: { tokenString: $tokenString }) {
      error { message }
      token {
        id
        tokenString
        expiration
        notes
        trustedIPAddresses
        persona { id name }
      }
    }
  }
`;
