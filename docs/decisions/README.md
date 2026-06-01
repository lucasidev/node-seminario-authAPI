# Architecture Decision Records

Registro de las decisiones de arquitectura de este proyecto: por qué el
código, la seguridad y el pipeline son como son. Cada ADR captura una decisión
con sus alternativas reales y el tradeoff que se asumió, para que el porqué no
se pierda con el tiempo.

## Criterio: cuándo una decisión merece un ADR

Una decisión se documenta como ADR si cumple al menos dos de estas tres:

1. **Había alternativas reales.** Se eligió entre opciones con tradeoffs.
2. **Alguien querría romperla en 3 meses sin entender por qué.** Si el cambio
   parece obvio pero rompe algo no evidente, el ADR lo previene.
3. **El "por qué" se olvida fácil.** La razón no es deducible del código solo.

Lo que es consecuencia técnica forzada o best practice estándar de bajo riesgo
no lleva ADR: vive en el README o en un comentario inline.

## Índice

| ADR | Decisión |
|---|---|
| [0001](0001-typescript-rewrite-package-by-feature.md) | Rewrite a TypeScript con arquitectura package-by-feature |
| [0002](0002-non-uniform-internal-layering.md) | Layering interno no uniforme (service solo donde aporta, sin repositories) |
| [0003](0003-optional-redis-cache-with-graceful-degradation.md) | Cache Redis opcional con degradación elegante |
| [0004](0004-http-surface-hardening.md) | Hardening de la superficie HTTP |
| [0005](0005-auth-security-no-admin-escalation-and-anti-enumeration.md) | Endurecimiento de auth: sin escalada a admin, anti user-enumeration |
| [0006](0006-supply-chain-hardening-ghcr-publish.md) | Supply-chain hardening al publicar la imagen |
| [0007](0007-cross-platform-lockfile-handling.md) | Manejo del lockfile cross-platform en CI y Docker |

## Formato

Cada ADR sigue la misma estructura: Contexto, Decisión, Alternativas
consideradas, Consecuencias. Estado y fecha en el encabezado.
