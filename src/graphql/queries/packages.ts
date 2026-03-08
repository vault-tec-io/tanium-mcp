export const PACKAGES_QUERY = `
  query Packages($first: Int, $after: Cursor) {
    packageSpecs(first: $first, after: $after) {
      edges {
        cursor
        node {
          name
          command
          contentSetName
          commandTimeoutSeconds
          expireSeconds
          params {
            name
            label
            defaultValue
          }
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

export const PACKAGE_BY_NAME_QUERY = `
  query PackageByName($filter: FieldFilter) {
    packageSpecs(first: 1, filter: $filter) {
      edges {
        node {
          name
          command
          contentSetName
          commandTimeoutSeconds
          expireSeconds
          params {
            name
            label
            defaultValue
          }
        }
      }
    }
  }
`;
