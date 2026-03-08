export const ENDPOINTS_QUERY = `
  query Endpoints(
    $first: Int
    $after: Cursor
    $filter: FieldFilter
    $sort: [EndpointSortInput!]
    $source: EndpointSource
  ) {
    endpoints(
      first: $first
      after: $after
      filter: $filter
      sort: $sort
      source: $source
    ) {
      edges {
        cursor
        node {
          id
          computerName
          ipAddress
          macAddresses
          os {
            platform
            name
            generation
          }
          lastSeen
          status
          tags {
            name
          }
          namespace
          eid
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
