import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server, GQL_URL, PLATFORM_URL, mockToken } from '../mocks/tanium-server.js';

vi.stubEnv('TANIUM_BASE_URL', 'https://test-api.cloud.tanium.com');
vi.stubEnv('TANIUM_API_TOKEN', mockToken);
vi.stubEnv('TANIUM_POLL_INTERVAL_MS', '100');
vi.stubEnv('TANIUM_POLL_TIMEOUT_MS', '5000');

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Action polling', () => {
  it('polls until action reaches terminal state', async () => {
    let pollCount = 0;

    server.use(
      http.post(GQL_URL, async ({ request }) => {
        const body = await request.json() as { query: string; variables: { id: string } };

        if (body.query.includes('apiTokenRotate')) {
          return HttpResponse.json({
            data: { apiTokenRotate: { error: null, token: { tokenString: mockToken, expiration: new Date(Date.now() + 86400000).toISOString() } } },
          });
        }

        if (body.query.includes('action(') && body.variables?.id === 'action-123') {
          pollCount++;
          const completed = pollCount >= 3 ? 5 : 0;
          const running = pollCount >= 3 ? 0 : 5;

          return HttpResponse.json({
            data: {
              action: {
                id: 'action-123',
                name: 'Test Action',
                comment: '',
                status: pollCount >= 3 ? 'COMPLETE' : 'RUNNING',
                stopped: false,
                creator: { id: '1', name: 'admin' },
                package: { name: 'Test Package' },
                results: {
                  completed,
                  running,
                  waiting: 0,
                  downloading: 0,
                  failed: 0,
                  expired: 0,
                  failedVerification: 0,
                  pendingVerification: 0,
                  verified: 0,
                  other: 0,
                  expected: 5,
                },
                targets: {},
              },
            },
          });
        }

        return HttpResponse.json({ data: {} });
      })
    );

    const { initAuth } = await import('../../src/http/auth.js');
    initAuth(mockToken, GQL_URL);

    const { pollActionStatus } = await import('../../src/polling/actions.js');
    const result = await pollActionStatus('action-123', 5000, 100);

    expect(result.timedOut).toBe(false);
    expect(result.status).toBe('completed');
    expect(result.action.results.completed).toBe(5);
    expect(pollCount).toBeGreaterThanOrEqual(3);
  });

  it('returns timed_out when action does not complete in time', async () => {
    server.use(
      http.post(GQL_URL, () => {
        return HttpResponse.json({
          data: {
            action: {
              id: 'slow-action',
              name: 'Slow Action',
              comment: '',
              status: 'RUNNING',
              stopped: false,
              creator: { id: '1', name: 'admin' },
              package: { name: 'Slow Package' },
              results: {
                completed: 0, running: 5, waiting: 0, downloading: 0,
                failed: 0, expired: 0, failedVerification: 0,
                pendingVerification: 0, verified: 0, other: 0, expected: 5,
              },
              targets: {},
            },
          },
        });
      })
    );

    const { initAuth } = await import('../../src/http/auth.js');
    initAuth(mockToken, GQL_URL);

    const { pollActionStatus } = await import('../../src/polling/actions.js');
    const result = await pollActionStatus('slow-action', 300, 100); // 300ms timeout

    expect(result.timedOut).toBe(true);
    expect(result.status).toBe('timed_out');
  });
});

describe('Question polling', () => {
  it('polls until 95% threshold reached', async () => {
    let pollCount = 0;

    server.use(
      http.get(`${PLATFORM_URL}/result_info/question/:id`, () => {
        pollCount++;
        const passed = pollCount >= 3 ? 95 : pollCount * 30;

        return HttpResponse.json({
          data: {
            result_info: {
              question: {
                mr_passed: passed,
                mr_tested: 100,
                estimated_total: 100,
              },
            },
          },
        });
      }),
      http.get(`${PLATFORM_URL}/result_data/question/:id`, () => {
        return HttpResponse.json({
          data: {
            result_sets: [{
              columns: [{ name: 'Operating System', what_hash: 1 }],
              rows: [{ data: [[{ text: 'Windows 11' }]] }],
            }],
          },
        });
      })
    );

    const { initAuth } = await import('../../src/http/auth.js');
    initAuth(mockToken, GQL_URL);

    const { pollQuestionResults } = await import('../../src/polling/questions.js');
    const result = await pollQuestionResults('q-001', 5000, 100);

    expect(result.timedOut).toBe(false);
    expect(result.respondedPercentage).toBeGreaterThanOrEqual(95);
  });
});
