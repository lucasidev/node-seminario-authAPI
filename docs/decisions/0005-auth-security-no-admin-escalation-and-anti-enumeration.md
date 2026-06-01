# 0005. Endurecimiento de auth: sin escalada a admin, anti user-enumeration

- Estado: Aceptada
- Fecha: 2026-06-01

## Contexto

La revisión del flujo de autenticación destapó dos vulnerabilidades reales en
el código original:

1. **Escalada de privilegios en el signup.** El handler de registro aceptaba
   un array `roles` del body y lo honraba tras un chequeo superficial. Un
   cliente podía hacer `POST {"roles": ["admin"]}` y auto-promoverse a admin
   sin siquiera autenticarse (commit `fix(auth): public signup never grants
   admin role`).
2. **User enumeration en el signin.** `signIn` devolvía 404 para emails
   inexistentes y 401 para contraseñas incorrectas. Esa diferencia de status
   permitía descubrir qué emails están registrados, probando de a uno (commit
   `refactor(auth): cut wasted DB queries and avoid user enumeration`).

## Decisión

Cerrar ambas:

- **Signup público nunca otorga admin.** Ignora el campo `roles` del body y
  asigna siempre el rol `user`. La asignación de admin solo ocurre por
  `POST /api/users`, detrás de `verifyToken` + `isAdmin`.
- **Signin uniforme.** Tanto email inexistente como password incorrecto
  devuelven el mismo `401` con el mismo body `'Invalid credentials'`. No hay
  señal observable que distinga los dos casos.

De paso, ese trabajo recortó queries redundantes: `verifyToken` ya no hace un
`findById` por request (el JWT es la fuente de verdad hasta expirar), e
`isAdmin` lee los roles ya poblados en vez de re-consultarlos.

## Alternativas consideradas

- **Honrar `roles` solo si quien llama ya es admin.** Hubiera requerido auth en
  el signup, que por definición es público. Más simple y seguro: el signup
  nunca toca roles.
- **Mensajes de error específicos en signin** ("email no registrado" vs
  "password incorrecto"). Mejor UX, pero filtra qué cuentas existen. La
  uniformidad de respuesta prioriza no enumerar sobre el detalle del error.

## Consecuencias

- **A favor:** se elimina una escalada de privilegios trivial y un canal de
  enumeración de usuarios. Ambas correcciones tienen tests que las cubren.
- **En contra:** el mensaje de login es genérico, así que el usuario no sabe si
  se equivocó de email o de password. Es el tradeoff de seguridad aceptado.
- Efecto secundario positivo: menos round-trips a Mongo por request
  autenticado.
