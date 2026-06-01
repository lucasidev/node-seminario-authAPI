# 0004. Hardening de la superficie HTTP

- Estado: Aceptada
- Fecha: 2026-06-01

## Contexto

Una API Express con la configuración por defecto deja varias puntas sueltas:
headers de seguridad ausentes, CORS permisivo, body sin límite de tamaño, sin
rate limiting, y llamadas a APIs externas sin timeout. Cada una es un vector
de abuso o de denegación de servicio.

## Decisión

Endurecer la superficie HTTP en `src/app.ts` con varias capas (commit
`feat(security): harden HTTP surface`):

- **helmet** para los headers de seguridad (`app.ts:19`).
- **CORS con allowlist** por origen configurado, no `*` (`app.ts:21-26`).
- **Límite de body** a 20kb (`app.ts:27`): un JSON de auth o de captura no
  necesita más, y el límite corta payloads abusivos.
- **Doble rate limiting**: un limiter global sobre `/api` (`app.ts:34`) y uno
  dedicado y más estricto para las rutas de credenciales `/api/auth`
  (`app.ts:45,55`), que es donde un atacante haría fuerza bruta.
- **Timeout con AbortSignal** en las llamadas a la PokeAPI, para no quedar
  colgado si el upstream no responde.

## Alternativas consideradas

- **Configuración por defecto de Express.** Lo mínimo para que funcione, pero
  deja la API expuesta a las puntas de arriba. Para una entrega que evalúa
  seguridad, no alcanza.
- **Un solo rate limiter global.** Más simple, pero trata igual a `/api/pokemon`
  (lectura barata) que a `/api/auth/signin` (objetivo de fuerza bruta). El
  limiter dedicado de auth permite un umbral más estricto donde importa.

## Consecuencias

- **A favor:** varias clases de abuso (XSS via headers, CORS abuse, payloads
  gigantes, fuerza bruta, upstream colgado) quedan mitigadas en el borde, antes
  de llegar a la lógica.
- **En contra:** el rate limiting puede afectar pruebas de carga desde una sola
  IP (k6), por eso el límite es configurable por env (`RATE_LIMIT_MAX`). El
  limiter de auth se desactiva en `NODE_ENV=test` para que la suite pueda
  registrar muchos usuarios.
- La allowlist de CORS hay que mantenerla cuando cambian los orígenes
  permitidos.
