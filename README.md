# Firebase Studio / Asesor Virtual

Proyecto extendido con:
- Chat con Gemini con lógica determinística para cursos.
- Panel de administración (usuarios, conversaciones, resúmenes IA).
- Reset de contraseña en desarrollo.
- Captura inline de datos de cliente (lead capture).

## Variables de Entorno y Secretos
Crear `.env.local` (no commitear) y definir sólo lo necesario para local:

```
GEMINI_API_KEY=tu_clave_local (opcional si usarás Secret Manager)
DEV_RESET_KEY=clave_dev_para_resets
NEXT_PUBLIC_LEAD_CAPTURE_KEYWORD=!capturar
FIREBASE_PROJECT_ID=asesor-comercial-studyx
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

En producción NO dependas de exponer `GEMINI_API_KEY` en variables de entorno públicas. El código usa `getEnvOrSecret(name)` que:
1. Busca `process.env[name]`
2. Si no existe, intenta `projects/$PROJECT_ID/secrets/$NAME/versions/latest` en Secret Manager.

Permisos requeridos: la identidad de ejecución (Cloud Run / App Hosting / Functions) necesita `roles/secretmanager.secretAccessor`.

Recomendado: almacenar también un secreto `FIREBASE_SERVICE_ACCOUNT_JSON` (o base64) y evitar la private key plana. El inicializador de Admin soporta:
- `FIREBASE_SERVICE_ACCOUNT_FILE`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `FIREBASE_SERVICE_ACCOUNT_BASE64`
- Trío `FIREBASE_PROJECT_ID|FIREBASE_CLIENT_EMAIL|FIREBASE_PRIVATE_KEY`

No uses ya `NEXT_PUBLIC_GEMINI_API_KEY`; toda invocación a Gemini se hace server-side.

`NEXT_PUBLIC_LEAD_CAPTURE_KEYWORD` permite disparar manualmente el formulario escribiendo esa palabra en el chat.

## Lead Capture
Cuando la IA detecta intención (heurística) o se escribe la keyword, responde invitando a completar un formulario que guarda `customerData` y `leadCapture` en `conversations/{id}`.

## Desarrollo
`npm run dev` inicia la app en el puerto configurado. Revisa `src/ai/flows/chat-flow.ts` para la lógica de disparo de captura.

### Flujo Gemini Seguro
- Archivo: `src/ai/flows/chat-flow.ts`
- Lazy-init de cliente Gemini con caching en memoria.
- Determinismo para cursos: lee `public/cursos.txt` y evita al modelo listar inventado.
- Resumen de conversación: endpoint `src/pages/api/summarize-conversation.ts` reusa la misma estrategia de secreto.

### Rotación de Claves
1. Crear nueva versión del secreto `GEMINI_API_KEY`.
2. Desplegar (el código siempre usa `latest`).
3. Revocar la versión antigua.

### Errores Comunes
`No se pudo obtener GEMINI_API_KEY`: falta secreto o permisos Secret Manager.
`Formato inesperado de PRIVATE KEY`: la key perdió saltos `\n` o encabezado.

