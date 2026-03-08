// Note: patchDefinitions is Stability 1.0 (Experimental Early) — flagged in tool descriptions
export const PATCH_DEFINITIONS_QUERY = `
  query PatchDefinitions($first: Int, $after: Cursor) {
    patchDefinitions(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          title
          severity
          releaseDate
          platform
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalRecords
    }
  }
`;
