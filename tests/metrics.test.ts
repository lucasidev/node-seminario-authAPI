import request from 'supertest';
import app from '../src/app.js';
import { RoleModel } from '../src/users/role.model.js';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from './helpers/testDb.js';

// Reads a single sample value from the Prometheus text exposition format.
// Matches the metric name plus an optional label set, ignoring label order.
function readSample(text: string, name: string, labels: Record<string, string> = {}): number {
  const entries = Object.entries(labels);
  for (const line of text.split('\n')) {
    if (line.startsWith('#') || !line.startsWith(name)) continue;
    const matchesAll = entries.every(([k, v]) => line.includes(`${k}="${v}"`));
    if (!matchesAll) continue;
    const value = Number(line.slice(line.lastIndexOf(' ') + 1));
    if (!Number.isNaN(value)) return value;
  }
  return Number.NaN;
}

async function metricsText(): Promise<string> {
  const res = await request(app).get('/metrics');
  return res.text;
}

describe('GET /metrics', () => {
  beforeAll(async () => {
    await startInMemoryMongo();
  });

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  it('returns Prometheus text exposition format', async () => {
    const res = await request(app).get('/metrics');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('process_cpu_seconds_total');
    expect(res.text).toContain('nodejs_heap_size_total_bytes');
  });

  it('records http_requests_total after an API call', async () => {
    await request(app).get('/api');
    const res = await request(app).get('/metrics');

    expect(res.text).toMatch(/http_requests_total\{[^}]*route="\/api\/"[^}]*\}/);
  });
});

describe('domain and infra metrics', () => {
  beforeAll(async () => {
    await startInMemoryMongo();
  });

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  beforeEach(async () => {
    await clearDatabase();
    await RoleModel.create([{ name: 'user' }, { name: 'admin' }]);
  });

  async function registerAndGetToken(email: string): Promise<string> {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Metrics Tester',
        username: email.split('@')[0],
        email,
        password: 'tester12345',
      });
    return res.body.token as string;
  }

  it('counts authentication attempts by outcome', async () => {
    await registerAndGetToken('auth-metrics@example.com');

    const before = await metricsText();
    const failBefore = readSample(before, 'auth_attempts_total', { result: 'failure' }) || 0;
    const okBefore = readSample(before, 'auth_attempts_total', { result: 'success' }) || 0;

    await request(app)
      .post('/api/auth/signin')
      .send({ email: 'auth-metrics@example.com', password: 'wrong-pass' });
    await request(app)
      .post('/api/auth/signin')
      .send({ email: 'auth-metrics@example.com', password: 'tester12345' });

    const after = await metricsText();
    expect(readSample(after, 'auth_attempts_total', { result: 'failure' })).toBe(failBefore + 1);
    expect(readSample(after, 'auth_attempts_total', { result: 'success' })).toBe(okBefore + 1);
  });

  it('counts caught pokemon as a domain event', async () => {
    const token = await registerAndGetToken('catch-metrics@example.com');

    const caughtBefore = readSample(await metricsText(), 'pokemon_caught_total') || 0;

    await request(app)
      .put('/api/users/pokedex/catch-pokemon')
      .set('Authorization', `Bearer ${token}`)
      .send({ pokemonName: 'pikachu' });

    expect(readSample(await metricsText(), 'pokemon_caught_total')).toBe(caughtBefore + 1);
  });

  it('exposes dependency_up for mongo after a health check', async () => {
    await request(app).get('/health');

    expect(readSample(await metricsText(), 'dependency_up', { dependency: 'mongo' })).toBe(1);
  });
});
