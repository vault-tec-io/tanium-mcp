export const REPORT_EXPORT_MUTATION = `
  mutation ReportExport($id: ID!) {
    reportExport(ref: { id: $id }) {
      error { message }
      exportData
    }
  }
`;

export const REPORT_IMPORT_MUTATION = `
  mutation ReportImport($input: ReportImportInput!) {
    reportImport(input: $input) {
      error { message }
      report {
        id
        name
        description
      }
    }
  }
`;

// Stability 1.2 — Experimental RC
export const REPORT_DELETE_MUTATION = `
  mutation ReportDelete($id: ID!) {
    reportDelete(ref: { id: $id }) {
      error { message }
    }
  }
`;
