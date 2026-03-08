export const SENSORS_QUERY = `
  query Sensors($first: Int, $after: Cursor) {
    sensors(first: $first, after: $after) {
      edges {
        cursor
        node {
          name
          description
          category
          contentSetName
          hidden
          parameters {
            name
            type
            label
            defaultValue
          }
          columns {
            name
            valueType
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

export const SENSOR_QUERY = `
  query Sensor($name: String!) {
    sensors(first: 1) {
      edges {
        node {
          name
          description
          category
          contentSetName
          hidden
          parameters {
            name
            type
            label
            defaultValue
          }
          columns {
            name
            valueType
          }
        }
      }
    }
  }
`;

export const SENSOR_BY_NAME_QUERY = `
  query SensorByName($filter: FieldFilter) {
    sensors(first: 1, filter: $filter) {
      edges {
        node {
          name
          description
          category
          contentSetName
          hidden
          parameters {
            name
            type
            label
            defaultValue
          }
          columns {
            name
            valueType
          }
        }
      }
    }
  }
`;
