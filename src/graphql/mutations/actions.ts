export const ACTION_PERFORM_MUTATION = `
  mutation ActionPerform($input: ActionPerformInput!) {
    actionPerform(input: $input) {
      error { message retryable timedOut }
      action {
        id
        name
        status
        results {
          completed running waiting downloading failed expired expected
        }
      }
      scheduledAction {
        id
        name
        status
      }
    }
  }
`;

export const ACTION_STOP_MUTATION = `
  mutation ActionStop($id: ID!) {
    actionStop(ref: { id: $id }) {
      error { message }
    }
  }
`;

export const SCHEDULED_ACTION_CREATE_MUTATION = `
  mutation ScheduledActionCreate($input: ScheduledActionCreateInput!) {
    scheduledActionCreate(input: $input) {
      error { message }
      scheduledAction {
        id
        name
        status
        approver { id name }
      }
    }
  }
`;

export const SCHEDULED_ACTION_APPROVE_MUTATION = `
  mutation ScheduledActionApprove($id: ID!) {
    scheduledActionApprove(ref: { id: $id }) {
      error { message }
      scheduledAction {
        id
        name
        status
      }
    }
  }
`;

export const SCHEDULED_ACTION_DELETE_MUTATION = `
  mutation ScheduledActionDelete($id: ID!) {
    scheduledActionDelete(ref: { id: $id }) {
      error { message }
    }
  }
`;

export const ACTION_GROUP_CREATE_MUTATION = `
  mutation ActionGroupCreate($input: ActionGroupCreateInput!) {
    actionGroupCreate(input: $input) {
      error { message }
      actionGroup {
        id
        name
        any
        computerGroups { id name }
      }
    }
  }
`;

export const ACTION_GROUP_DELETE_MUTATION = `
  mutation ActionGroupDelete($name: String, $id: ID) {
    actionGroupDelete(ref: { name: $name, id: $id }) {
      error { message }
    }
  }
`;
