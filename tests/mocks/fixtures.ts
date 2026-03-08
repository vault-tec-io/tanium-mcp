export const sensorListFixture = {
  data: {
    sensors: {
      edges: [
        {
          cursor: 'c1',
          node: {
            name: 'Operating System',
            description: 'Returns the operating system platform and version',
            category: 'Operating System',
            contentSetName: 'Default',
            hidden: false,
            parameters: [],
            columns: [{ name: 'Operating System', valueType: 'String' }],
          },
        },
        {
          cursor: 'c2',
          node: {
            name: 'IP Address',
            description: 'Returns the IP address of the endpoint',
            category: 'Network',
            contentSetName: 'Default',
            hidden: false,
            parameters: [],
            columns: [{ name: 'IP Address', valueType: 'String' }],
          },
        },
      ],
      pageInfo: { hasNextPage: false, endCursor: 'c2' },
      totalRecords: 2,
    },
  },
};

export const platformSensorsFixture = {
  data: {
    result_object: {
      sensor: [
        { id: 1, name: 'Operating System', description: 'Returns the OS', hash: 100 },
        { id: 2, name: 'IP Address', description: 'Returns IP', hash: 200 },
      ],
    },
  },
};

export const packageListFixture = {
  data: {
    packageSpecs: {
      edges: [
        {
          cursor: 'p1',
          node: {
            name: 'Distribute Tanium Standard Utilities',
            command: 'cmd.exe /c install.bat',
            contentSetName: 'Default',
            commandTimeoutSeconds: 300,
            expireSeconds: 600,
            params: [],
          },
        },
      ],
      pageInfo: { hasNextPage: false, endCursor: 'p1' },
      totalRecords: 1,
    },
  },
};

export const endpointsFixture = {
  data: {
    endpoints: {
      edges: [
        {
          cursor: 'ep1',
          node: {
            id: 'ep-001',
            computerName: 'DESKTOP-WIN-001',
            ipAddress: '10.0.0.1',
            os: { platform: 'Windows', name: 'Windows 11', generation: 'win11' },
            lastSeen: '2026-03-07T00:00:00Z',
            status: 'online',
            tags: [],
          },
        },
      ],
      pageInfo: { hasNextPage: false, endCursor: 'ep1' },
      totalRecords: 1,
    },
  },
};

export const actionPerformFixture = {
  data: {
    actionPerform: {
      error: null,
      action: {
        id: 'action-123',
        name: 'Deploy Package',
        status: 'RUNNING',
        results: {
          completed: 0, running: 5, waiting: 0, downloading: 0,
          failed: 0, expired: 0, expected: 5,
        },
      },
      scheduledAction: null,
    },
  },
};

export const actionResultFixture = {
  data: {
    action: {
      id: 'action-123',
      name: 'Deploy Package',
      comment: '',
      status: 'COMPLETE',
      stopped: false,
      stoppedFlag: false,
      creator: { id: 'user-1', name: 'admin' },
      package: { name: 'Distribute Tanium Standard Utilities' },
      results: {
        completed: 5, running: 0, waiting: 0, downloading: 0,
        failed: 0, expired: 0, failedVerification: 0,
        pendingVerification: 0, verified: 0, other: 0, expected: 5,
      },
      targets: {},
    },
  },
};

export const tokenRotateFixture = {
  data: {
    apiTokenRotate: {
      error: null,
      token: {
        tokenString: 'new-rotated-token',
        expiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    },
  },
};
