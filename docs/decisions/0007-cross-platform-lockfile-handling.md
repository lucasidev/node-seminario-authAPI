# 0007. Manejo del lockfile cross-platform en CI y Docker

- Estado: Aceptada
- Fecha: 2026-06-01

## Contexto

El `package-lock.json` se regenera en una máquina de desarrollo Windows. npm
(ver npm/cli#4828) omite del lockfile los binarios específicos de plataforma
que no aplican al host donde se genera: al regenerarlo en Windows, quedan
fuera las variantes linux de ciertos paquetes (socks, variantes de plataforma
de ajv, etc.). Entonces, en un runner linux, `npm ci` (que exige que el
lockfile sea exacto y completo) rechaza ese lock y falla.

Es un gotcha caro y poco obvio: el síntoma (CI roto en linux) está lejos de la
causa (lock regenerado en Windows), y el "arreglo" intuitivo (volver a
`npm ci`) reintroduce el problema.

## Decisión

En CI y en el Dockerfile, en vez de `npm ci`, usar
`npm install --ignore-scripts` seguido de `npm rebuild bcrypt`
(`Dockerfile:24`, `ci.yml:35,38`):

- `--ignore-scripts` evita correr lifecycle scripts arbitrarios en install.
- `npm rebuild bcrypt` recompila solo el módulo nativo que lo necesita.

Además, un guard explícito (`scripts/check-lockfile-platforms.mjs`, corrido en
`ci.yml:32`) detecta si el lockfile perdió los binarios linux y falla temprano
con un mensaje claro, antes de que el error se manifieste de forma confusa más
adelante en el pipeline.

## Alternativas consideradas

- **`npm ci`** (el estándar para CI). Es lo correcto en teoría, pero rechaza el
  lockfile regenerado en Windows. Volver a `npm ci` sin reconciliar el lock
  rompe el build en linux.
- **Regenerar el lockfile en CI (linux) en cada corrida.** Resolvería el
  desajuste, pero hace el build no determinista respecto del lock commiteado y
  esconde el problema en vez de detectarlo.
- **Comprometer un lockfile generado en linux.** Obliga a que todos generen el
  lock en linux, lo que no es realista en un equipo con Windows. El guard +
  `npm install` tolera el lock de Windows de forma controlada.

## Consecuencias

- **A favor:** el build funciona con un lockfile generado en Windows o en
  linux. El guard convierte un fallo confuso y tardío en un error temprano y
  explícito.
- **En contra:** se pierde la garantía de instalación exacta que da `npm ci`
  (`npm install` puede ajustar el árbol). Es el tradeoff aceptado para
  tolerar el lock cross-platform. El guard acota el riesgo a la dimensión que
  importa (binarios de plataforma).
- Quien "simplifique" esto a `npm ci` sin entender el contexto romperá el
  build en linux: de ahí este ADR.
