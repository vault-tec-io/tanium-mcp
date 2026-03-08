export const PLAYBOOK_START_MUTATION = `
  mutation PlaybookStart($input: PlaybookStartInput!) {
    playbookStart(input: $input) {
      error { message }
      run {
        id
        status
        startedAt
      }
    }
  }
`;

export const PLAYBOOK_UPSERT_MUTATION = `
  mutation PlaybookUpsert($input: PlaybookUpsertInput!) {
    playbookUpsert(input: $input) {
      error { message }
      playbook {
        id
        name
        description
        status
      }
    }
  }
`;

export const PLAYBOOK_SCHEDULE_UPSERT_MUTATION = `
  mutation PlaybookScheduleUpsert($input: PlaybookScheduleUpsertInput!) {
    playbookScheduleUpsert(input: $input) {
      error { message }
    }
  }
`;
