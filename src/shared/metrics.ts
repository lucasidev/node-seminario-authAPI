import { Counter, collectDefaultMetrics, Gauge, Histogram, Registry } from 'prom-client';

export const metricsRegistry = new Registry();

metricsRegistry.setDefaultLabels({ service: 'pokedex-api' });
collectDefaultMetrics({ register: metricsRegistry });

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [metricsRegistry],
});

export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
});

export const pokeapiRequestsTotal = new Counter({
  name: 'pokeapi_requests_total',
  help: 'Total outbound requests to pokeapi.co',
  labelNames: ['status_code'] as const,
  registers: [metricsRegistry],
});

export const pokeapiRequestDurationSeconds = new Histogram({
  name: 'pokeapi_request_duration_seconds',
  help: 'PokeAPI outbound request duration in seconds',
  labelNames: ['status_code'] as const,
  buckets: [0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
});

export const pokeapiErrorsTotal = new Counter({
  name: 'pokeapi_errors_total',
  help: 'PokeAPI request errors by kind',
  labelNames: ['kind'] as const,
  registers: [metricsRegistry],
});

export const cacheHitsTotal = new Counter({
  name: 'cache_hits_total',
  help: 'Redis cache hits',
  labelNames: ['resource'] as const,
  registers: [metricsRegistry],
});

export const cacheMissesTotal = new Counter({
  name: 'cache_misses_total',
  help: 'Redis cache misses',
  labelNames: ['resource'] as const,
  registers: [metricsRegistry],
});

// Infra: 1 when the dependency is reachable, 0 when it is not. Updated by
// the health check so a down dependency is visible in Prometheus (pull),
// not only in the /health response.
export const dependencyUp = new Gauge({
  name: 'dependency_up',
  help: 'Whether a backing dependency is reachable (1) or not (0)',
  labelNames: ['dependency'] as const,
  registers: [metricsRegistry],
});

// Security: sign-in attempts split by outcome. A spike in failures is a
// brute-force signal (and pairs with the auth rate limiter).
export const authAttemptsTotal = new Counter({
  name: 'auth_attempts_total',
  help: 'Authentication attempts by outcome',
  labelNames: ['result'] as const,
  registers: [metricsRegistry],
});

// Product: domain events. Counts feature usage (catches, releases, teams)
// rather than just HTTP traffic, so the dashboard reflects the product.
export const pokemonCaughtTotal = new Counter({
  name: 'pokemon_caught_total',
  help: 'Pokemon successfully caught into a pokedex',
  registers: [metricsRegistry],
});

export const pokemonReleasedTotal = new Counter({
  name: 'pokemon_released_total',
  help: 'Pokemon released from a pokedex',
  registers: [metricsRegistry],
});

export const poketeamsCreatedTotal = new Counter({
  name: 'poketeams_created_total',
  help: 'Poketeams created',
  registers: [metricsRegistry],
});
