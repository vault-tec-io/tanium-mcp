export const MANAGE_SOFTWARE_MUTATION = `
  mutation ManageSoftware($input: ManageSoftwareInput!) {
    manageSoftware(input: $input) {
      error { message }
      deployment {
        id
        name
        status
        completedCount
        failedCount
        pendingCount
      }
    }
  }
`;
