export const PATCH_CREATE_DEPLOYMENT_MUTATION = `
  mutation PatchCreateDeployment($input: PatchCreateDeploymentInput!) {
    patchCreateDeployment(input: $input) {
      error { message }
      deployment {
        id
        name
        status
      }
    }
  }
`;

export const PATCH_STOP_DEPLOYMENT_MUTATION = `
  mutation PatchStopDeployment($id: ID!) {
    patchStopDeployment(ref: { id: $id }) {
      error { message }
    }
  }
`;

export const PATCH_LIST_UPSERT_MUTATION = `
  mutation PatchListUpsert($input: PatchListUpsertInput!) {
    patchListUpsert(input: $input) {
      error { message }
      patchList {
        id
        name
        description
      }
    }
  }
`;
