export const COMPUTER_GROUPS_QUERY = `
  query ComputerGroups($first: Int, $after: Cursor) {
    computerGroups(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          name
          text
          type
          computerCount
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

export const COMPUTER_GROUP_QUERY = `
  query ComputerGroup($name: String, $id: ID) {
    computerGroup(ref: { name: $name, id: $id }) {
      id
      name
      text
      type
      computerCount
    }
  }
`;
