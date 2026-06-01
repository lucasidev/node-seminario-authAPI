# 0006. Supply-chain hardening al publicar la imagen

- Estado: Aceptada
- Fecha: 2026-06-01

## Contexto

Publicar una imagen Docker a un registry puede ser tan simple como un
`docker push`. Pero una imagen sin procedencia ni firma es un eslabón débil de
la cadena de suministro: quien la consume no puede verificar quién la
construyó, con qué, ni si fue alterada después de publicada.

## Decisión

El job de publish a GHCR (`.github/workflows/ci.yml`) endurece la cadena de
suministro (commit `ci: harden image publishing`):

- **Provenance `mode=max`** (`ci.yml:147`): adjunta atestación SLSA de cómo y
  dónde se construyó la imagen.
- **SBOM embebido** (`ci.yml:146`): la build incluye el bill of materials de
  lo que hay dentro.
- **Firma cosign keyless** (`ci.yml:120-121,154`): la imagen se firma con
  cosign usando el token OIDC de GitHub (sin claves de firma que guardar). La
  firma se ata al digest, así cubre todos los tags.
- El job declara `permissions: id-token: write` para el OIDC de cosign
  (`ci.yml:114`).

## Alternativas consideradas

- **`docker push` simple, sin firma ni provenance.** Lo mínimo para publicar.
  Se descartó: deja la imagen sin verificabilidad, que es justo lo que un
  pipeline que evalúa seguridad debería aportar.
- **Firma con clave gestionada (cosign con par de claves).** Funciona, pero
  obliga a guardar y rotar una clave privada de firma. Cosign keyless con OIDC
  elimina ese secreto: la identidad de quien firma es el propio workflow.
- **Multi-arch (amd64 + arm64).** Se evaluó y se descartó: la build arm64 por
  emulación QEMU disparaba timeouts en CI, y el target de deploy es amd64. Se
  publica solo `linux/amd64` (`ci.yml:145`).

## Consecuencias

- **A favor:** la imagen es verificable de punta a punta: quien la consume
  puede comprobar la firma y la procedencia. Cero secretos de firma que
  gestionar (keyless).
- **En contra:** la imagen es solo amd64; un consumidor arm64 (ej. Apple
  Silicon nativo) no la corre sin emulación. Aceptable porque el deploy es
  amd64.
- El pipeline depende de la disponibilidad del flujo OIDC de GitHub y de
  Sigstore para la firma.
