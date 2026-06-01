# 0003. Cache Redis opcional con degradación elegante

- Estado: Aceptada
- Fecha: 2026-06-01

## Contexto

La feature `pokemon` proxea la PokeAPI pública. Sin cache, cada request pega a
`pokeapi.co`, lo que es lento y desconsiderado con un servicio gratuito. Hace
falta una cache. La pregunta es qué tipo y qué pasa si no está disponible.

## Decisión

Usar **Redis en un contenedor aparte** como cache-aside, pero **opcional**: si
`REDIS_URL` no está seteada, la app arranca igual y el proxy bypasea la cache
en vez de fallar. La lógica está en `src/shared/infra/redis.ts`:
`isRedisEnabled()` chequea la env var (`redis.ts:7-8`), y si no hay URL la
conexión devuelve `null` con un warning (`redis.ts:23-25`), no una excepción.
La capa de servicio incrementa contadores `cache_hits_total` /
`cache_misses_total` para que el comportamiento sea observable.

## Alternativas consideradas

- **Cache in-memory (un Map en el proceso).** Cero infraestructura, pero no
  sobrevive a reinicios, no se comparte entre instancias, y no expone métricas
  hit/miss reales de un sistema de cache. Redis en contenedor da exactamente
  esa observabilidad, que es parte del valor (las métricas de cache alimentan
  el dashboard).
- **Redis obligatorio (la app no arranca sin él).** Más simple de razonar,
  pero acopla el arranque de la API a una dependencia que para muchos flujos
  (tests, dev sin Redis) es innecesaria. La degradación elegante permite correr
  la API sola.

## Consecuencias

- **A favor:** métricas hit/miss visibles para observabilidad; la API corre con
  o sin Redis; los tests no necesitan levantar Redis.
- **En contra:** hay dos caminos de código (con y sin cache) que mantener y
  testear. El path sin cache es el degradado, con su propio test. Una falla de
  Redis en runtime también cae al path de bypass (se loguea como warning), lo
  que prioriza disponibilidad sobre cache.
- El TTL de la cache es configurable por env (`POKEAPI_CACHE_TTL_SECONDS`).
