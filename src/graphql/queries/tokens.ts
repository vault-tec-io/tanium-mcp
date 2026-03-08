export const MY_API_TOKENS_QUERY = `
  query MyAPITokens {
    myAPITokens {
      error { message }
      tokens {
        id
        created
        expiration
        lastUsed
        notes
        persona { id name }
        trustedIPAddresses
      }
    }
  }
`;
