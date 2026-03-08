export const SOFTWARE_PACKAGES_QUERY = `
  query SoftwarePackages($first: Int, $after: Cursor) {
    softwarePackages(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          name
          description
          vendor
          productVersion
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

export const SOFTWARE_DEPLOYMENT_QUERY = `
  query SoftwareDeployment($id: ID!) {
    softwareDeployment(id: $id) {
      id
      name
      status
      completedCount
      failedCount
      pendingCount
    }
  }
`;
