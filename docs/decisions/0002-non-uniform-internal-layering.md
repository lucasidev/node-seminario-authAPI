# 0002. Layering interno no uniforme (service solo donde aporta, sin repositories)

- Estado: Aceptada
- Fecha: 2026-06-01

## Contexto

Con la estructura package-by-feature ([ADR 0001](0001-typescript-rewrite-package-by-feature.md)),
cada feature decide cómo organiza su lógica interna. La tentación es imponer
el mismo patrón a todas (controller -> service -> repository) por consistencia.
Pero las features no tienen la misma complejidad: `auth` y `users` hablan con
Mongo directo, mientras que `pokemon` orquesta dos sistemas externos (la
PokeAPI pública y Redis).

## Decisión

Layering **no uniforme**, guiado por la complejidad real de cada feature:

- `pokemon` tiene una capa `service` aparte (`pokemon.service.ts`) porque
  coordina PokeAPI + cache Redis: ahí la orquestación justifica separarla del
  controller.
- `auth` y `users` llaman a Mongoose directo desde el controller. No hay capa
  service intermedia que solo reenvíe llamadas.
- No hay repositories: Mongoose ya es la capa de acceso a datos.

La justificación está escrita también en el README (sección de layering
interno por feature).

## Alternativas consideradas

- **Service + repository en todas las features, uniforme.** Es el patrón
  "enterprise" por defecto. Se descartó porque a esta escala un service que
  solo delega al controller y un repository que solo envuelve a Mongoose son
  capas vacías: indirección sin valor. Sumarlas "por consistencia" es la
  abstracción equivocada.
- **Service en todas para anticipar crecimiento.** YAGNI: extraer la capa
  cuando una feature realmente la necesite (como `pokemon`), no antes.

## Consecuencias

- **A favor:** menos indirección; el código de `auth`/`users` es directo y
  legible. La capa `service` existe solo donde gana su lugar.
- **En contra:** la estructura no es simétrica entre features, lo que puede
  sorprender a quien espera uniformidad. El costo se mitiga documentándolo
  (este ADR + README).
- Si `auth` o `users` crecieran en complejidad (ej. orquestación de varios
  sistemas), extraer un service en ese momento es barato y local.
