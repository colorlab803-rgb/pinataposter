# PinataPoster — Instrucciones para Claude Code

## Idioma
Responde siempre en español latino.

## Proyecto
App Next.js 15 que divide imágenes para impresión a gran escala en múltiples hojas.
- **Stack:** Next.js 15 / React 18 / TypeScript / Tailwind CSS / shadcn/ui
- **Deploy:** Docker en Contabo VPS (`212.28.191.156:3010`)

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

## Deploy en VPS
- SSH: `ssh -i /home/trefactory/Desktop/PROYECTOS/claves/keys/produccion/contabo-key root@212.28.191.156`
- Directorio: `/opt/pinataposter`
- Contenedor: `pinataposter-app-1` (puerto 3010)
- Para desplegar: `git pull` en el VPS + `docker compose up -d --build`
- Verificar con: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3010`

## Archivos clave
- `src/` — código fuente Next.js
- `docker-compose.yml` — configuración Docker
- `Dockerfile` — imagen de producción
- `nginx/` — configuración nginx (proxy reverso)
