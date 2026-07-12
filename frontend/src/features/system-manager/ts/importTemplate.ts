export const systemManagerImportTemplate = {
  version: 1,
  environments: [
    {
      key: 'sandbox',
      name: 'Sandbox',
      description: 'Topology review environment',
      color: '#059669',
      sortOrder: 40,
    },
  ],
  hosts: [
    {
      environmentKey: 'sandbox',
      name: 'sandbox-app-01',
      ip: '10.50.0.11',
      description: 'Sandbox Docker host',
      sortOrder: 0,
    },
  ],
  nodes: [
    {
      code: 'sandbox-web',
      name: 'Sandbox Web/API',
      kind: 'app',
      type: 'Web/API',
      description: 'Application entrypoint',
      notes: 'Global node; runtime values live in bindings.',
      positionX: 80,
      positionY: 180,
      bindings: [
        {
          environmentKey: 'sandbox',
          hostName: 'sandbox-app-01',
          status: 'healthy',
          tags: ['Laravel', 'Docker'],
          containerName: 'sandbox-web',
          image: 'company/sandbox-web:latest',
          ports: ['8080'],
          network: 'sandbox-net',
          configs: [
            {
              name: 'App',
              items: [
                {
                  key: 'APP_ENV',
                  value: 'sandbox',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      code: 'sandbox-redis',
      name: 'Sandbox Redis',
      kind: 'service',
      type: 'Cache',
      description: 'Shared cache service',
      positionX: 430,
      positionY: 180,
      bindings: [
        {
          environmentKey: 'sandbox',
          hostName: 'sandbox-app-01',
          status: 'healthy',
          containerName: 'sandbox-redis',
          image: 'redis:7-alpine',
          ports: ['6379'],
          configs: [],
        },
      ],
    },
  ],
  dependencies: [
    {
      code: 'sandbox-web-redis',
      sourceCode: 'sandbox-web',
      targetCode: 'sandbox-redis',
      label: 'REDIS_HOST',
      connectionType: 'redis',
      direction: 'read',
      port: '6379',
      description: 'Web/API reads cache from Redis',
      sortOrder: 0,
      bindings: [
        {
          environmentKey: 'sandbox',
          configItems: [
            {
              key: 'REDIS_HOST',
              value: 'redis.sandbox.local',
            },
            {
              key: 'REDIS_PASSWORD',
              value: 'secret:change-me',
            },
          ],
        },
      ],
    },
  ],
}
