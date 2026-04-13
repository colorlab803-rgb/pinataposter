# PinataPoster — Instrucciones para Claude Code

## Idioma
Responde siempre en español latino.

## Proyecto
App Next.js 15 que divide imágenes para impresión a gran escala en múltiples hojas.
- **Stack:** Next.js 15 / React 18 / TypeScript / Tailwind CSS / shadcn/ui
- **Deploy:** Google Cloud Run (proyecto `rutas-488705`, región `us-central1`)
- **URL:** `https://pinataposter-58669055557.us-central1.run.app`

## Git — Commits
- Usar conventional commits en español:
  - `feat:` nueva funcionalidad
  - `fix:` corrección de bug
  - `refactor:` mejora sin cambio de comportamiento
  - `chore:` tareas de mantenimiento
  - `docs:` documentación
- Ejemplos: `feat: agregar modo oscuro`, `fix: corregir exportación PDF en Safari`
- No incluir Co-Authored-By ni firmas automáticas

## Git — Push
- Remote: `origin` → `https://github.com/colorlab803-rgb/pinataposter.git`
- Branch principal: `main`
- Siempre hacer push a `origin main` después de cada commit
- No usar force push salvo indicación explícita

## Deploy en Cloud Run
- Proyecto GCP: `rutas-488705`
- Región: `us-central1`
- Servicio: `pinataposter`
- **Importante:** Las variables `NEXT_PUBLIC_*` se incrustan en el cliente en **build time**. Están en `.env.production` (se incluye en Docker via `.dockerignore`). Las variables server-only se pasan en runtime con `--set-env-vars`.
- Para desplegar:
  ```bash
  gcloud run deploy pinataposter \
    --project=rutas-488705 \
    --region=us-central1 \
    --source=. \
    --set-env-vars="NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1,HOSTNAME=0.0.0.0,ADMIN_PASSWORD=PinataPoster2026!,GOOGLE_AI_API_KEY=<TU_API_KEY>,REPLICATE_API_TOKEN=<TU_REPLICATE_KEY>" \
    --max-instances=3 \
    --memory=512Mi \
    --cpu=1 \
    --allow-unauthenticated \
    --cpu-boost
  ```
- Verificar con: `curl -s -o /dev/null -w "%{http_code}" https://pinataposter-58669055557.us-central1.run.app`

## Archivos clave
- `src/` — código fuente Next.js
- `docker-compose.yml` — configuración Docker
- `Dockerfile` — imagen de producción
- `nginx/` — configuración nginx (proxy reverso)
