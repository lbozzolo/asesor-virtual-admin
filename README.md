# Firebase Studio / Asesor Virtual

Proyecto extendido con:
- Chat con Gemini con lógica determinística para cursos.
- Panel de administración (usuarios, conversaciones, resúmenes IA).
- Reset de contraseña en desarrollo.
- Captura inline de datos de cliente (lead capture).

## Variables de Entorno
Crear `.env.local` (no commitear) y definir:

```
GEMINI_API_KEY=tu_clave
NEXT_PUBLIC_GEMINI_API_KEY=tu_clave_publica_opcional
DEV_RESET_KEY=clave_dev_para_resets
NEXT_PUBLIC_LEAD_CAPTURE_KEYWORD=!capturar
FIREBASE_PROJECT_ID=asesor-comercial-studyx
```

`NEXT_PUBLIC_LEAD_CAPTURE_KEYWORD` permite disparar manualmente el formulario escribiendo esa palabra en el chat.

## Lead Capture
Cuando la IA detecta intención (heurística) o se escribe la keyword, responde invitando a completar un formulario que guarda `customerData` y `leadCapture` en `conversations/{id}`.

## Desarrollo
`npm run dev` inicia la app en el puerto configurado. Revisa `src/ai/flows/chat-flow.ts` para la lógica de disparo de captura.
