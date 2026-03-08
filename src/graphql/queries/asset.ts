export const ASSET_PRODUCTS_QUERY = `
  query AssetProducts($first: Int, $after: Cursor, $filter: AssetProductsFilter) {
    assetProducts(first: $first, after: $after, filter: $filter) {
      edges {
        cursor
        node {
          name
          vendor
          version
          installedCount
          usedCount
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const ASSET_PRODUCT_ENDPOINTS_QUERY = `
  query AssetProductEndpoints($first: Int, $after: Cursor, $filter: AssetProductEndpointsFilter) {
    assetProductEndpoints(first: $first, after: $after, filter: $filter) {
      edges {
        cursor
        node {
          id
          computerName
          ipAddress
          lastSeen
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;
