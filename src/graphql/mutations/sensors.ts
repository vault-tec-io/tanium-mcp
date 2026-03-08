export const SENSOR_HARVEST_MUTATION = `
  mutation SensorHarvest($input: SensorHarvestInput!) {
    sensorHarvest(input: $input) {
      error { message }
    }
  }
`;
