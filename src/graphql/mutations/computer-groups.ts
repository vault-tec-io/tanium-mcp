export const COMPUTER_GROUP_CREATE_MUTATION = `
  mutation ComputerGroupCreate($input: ComputerGroupCreateInput!) {
    computerGroupCreate(input: $input) {
      error { message }
      computerGroup {
        id
        name
        text
        type
        computerCount
      }
    }
  }
`;

export const COMPUTER_GROUP_DELETE_MUTATION = `
  mutation ComputerGroupDelete($name: String, $id: ID) {
    computerGroupDelete(ref: { name: $name, id: $id }) {
      error { message }
    }
  }
`;
