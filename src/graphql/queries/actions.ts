export const ACTION_QUERY = `
  query Action($id: ID!) {
    action(ref: { id: $id }) {
      id
      name
      comment
      creationTime
      expirationTime
      startTime
      expireSeconds
      distributeSeconds
      status
      stopped
      stoppedFlag
      creator { id name }
      approver { id name }
      package { name }
      results {
        completed
        running
        waiting
        downloading
        failed
        expired
        failedVerification
        pendingVerification
        verified
        other
        expected
      }
      targets {
        actionGroup { name id }
        targetGroup { name id }
      }
    }
  }
`;

export const ACTIONS_QUERY = `
  query Actions($first: Int, $after: Cursor, $filter: FieldFilter) {
    actions(first: $first, after: $after, filter: $filter) {
      edges {
        cursor
        node {
          id
          name
          comment
          creationTime
          status
          stopped
          creator { id name }
          package { name }
          results {
            completed
            failed
            expected
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

export const SCHEDULED_ACTIONS_QUERY = `
  query ScheduledActions($first: Int, $after: Cursor, $filter: FieldFilter) {
    scheduledActions(first: $first, after: $after, filter: $filter) {
      edges {
        cursor
        node {
          id
          name
          comment
          status
          creator { id name }
          approver { id name }
          package { name }
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

export const ACTION_GROUPS_QUERY = `
  query ActionGroups($first: Int, $after: Cursor) {
    actionGroups(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          name
          any
          computerGroups { id name }
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

export const ACTION_GROUP_QUERY = `
  query ActionGroup($name: String, $id: ID) {
    actionGroup(ref: { name: $name, id: $id }) {
      id
      name
      any
      computerGroups { id name }
    }
  }
`;
