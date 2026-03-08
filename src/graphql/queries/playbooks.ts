export const PLAYBOOKS_QUERY = `
  query Playbooks($first: Int, $after: Cursor) {
    playbooks(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          name
          description
          status
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

export const PLAYBOOK_RUNS_QUERY = `
  query PlaybookRuns($first: Int, $after: Cursor, $playbookId: ID) {
    playbookRuns(first: $first, after: $after, playbookId: $playbookId) {
      edges {
        cursor
        node {
          id
          status
          startedAt
          completedAt
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

export const PLAYBOOK_RUN_QUERY = `
  query PlaybookRun($id: ID!) {
    playbookRun(id: $id) {
      id
      status
      startedAt
      completedAt
    }
  }
`;
