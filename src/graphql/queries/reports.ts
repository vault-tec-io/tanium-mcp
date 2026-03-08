export const REPORTS_QUERY = `
  query Reports($first: Int, $after: Cursor) {
    reports(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          name
          description
          author { id name }
          createdAt
          updatedAt
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

export const REPORT_RESULT_DATA_QUERY = `
  query ReportResultData($id: ID!, $after: Cursor, $first: Int) {
    reportResultData(id: $id, after: $after, first: $first) {
      edges {
        cursor
        node {
          columns
          rows
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
