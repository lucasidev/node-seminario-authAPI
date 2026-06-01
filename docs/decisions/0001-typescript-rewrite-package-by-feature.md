# 0001. Rewrite a TypeScript con arquitectura package-by-feature

- Estado: Aceptada
- Fecha: 2026-06-01

## Contexto

El proyecto nació como una API en JavaScript con la organización clásica por
capas técnicas (carpetas `controllers/`, `models/`, `routes/` separadas). Esa
estructura dispersa cada feature en varias carpetas: tocar "users" obliga a
saltar entre tres o cuatro directorios.

## Decisión

Reescribir la API en **TypeScript estricto** y reorganizar el código
**package-by-feature** (vertical slices): cada feature (`auth`, `users`,
`pokemon`, `system`) es una carpeta que contiene su model, schema, controller
y routes. Lo cross-cutting (config, infra, middlewares, utils) vive en
`shared/`. El detalle de la estructura está en el README, sección
Arquitectura.

## Alternativas consideradas

- **Mantener JavaScript.** Cero costo de migración, pero se pierde el chequeo
  de tipos en boundaries (DTOs, env, modelos), que es justo donde los bugs son
  caros. TypeScript strict con `noUncheckedIndexedAccess` atrapa esa clase de
  errores en compile time.
- **Capas técnicas horizontales (controllers/services/repositories).** Es el
  default conocido, pero a esta escala dispersa cada feature y no aporta: la
  cohesión por feature es más alta que por capa cuando el dominio es chico y
  las features son independientes.

## Consecuencias

- **A favor:** alta cohesión por feature; agregar o borrar una feature toca una
  sola carpeta. Tipos estrictos en los boundaries. ESM con NodeNext alinea el
  runtime con el estándar.
- **En contra:** ESM con NodeNext obliga a la extensión `.js` en imports
  relativos aunque el archivo sea `.ts` (requisito del resolver), lo que
  sorprende a quien no lo conoce. Es un costo conocido y documentado en las
  convenciones.
- El código JS original queda atrás en la historia del repo; la rama principal
  es la versión TypeScript.
