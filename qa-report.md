# QA Testing Report — MoldeGPT

**Fecha:** 2026-04-09 14:56  
**Ambiente:** Produccion (Cloud Run)  
**URL:** https://pinataposter-58669055557.us-central1.run.app  
**Revision:** pinataposter-00028-gzm  

---

## Resumen

| Metrica | Valor |
|---------|-------|
| Total de tests | 12 |
| Pasaron | 12 |
| Fallaron | 0 |
| Tasa de exito | 100% |
| Tiempo total | 30.0s |

---

## Resultados por caso de prueba

| ID | Nombre | Estado | Detalle | Duracion |
|----|--------|--------|---------|----------|
| TC-01a | Chat page loads | PASS | HTTP 200 | 1362ms |
| TC-01b | MoldeGPT API reachable | PASS | HTTP 400 (expected 400 for empty body) | 252ms |
| TC-01c | Upscale API reachable | PASS | HTTP 400 (expected 400 for empty body) | 224ms |
| TC-02 | Chat responde a saludo | PASS | ¡Hola! Soy MoldeGPT, tu piñatero experto. 🪅 Puedo ayudart... | 1381ms |
| TC-03a | Agente llama configurarTamano | PASS | tamano=True|papel=True|descarga=True|total=4|names=upscal... | 6944ms |
| TC-03b | Agente llama configurarPapel | PASS | tamano=True|papel=True|descarga=True|total=4|names=upscal... | 0ms |
| TC-03c | Agente llama descargarMolde | PASS | tamano=True|papel=True|descarga=True|total=4|names=upscal... | 0ms |
| TC-04 | Agente invoca upscalarImagen | PASS | upscalarImagen tool call presente | 1735ms |
| TC-05 | Agente reconfigura tamaño grande | PASS | yes|alto=120|ancho=80 | 4321ms |
| TC-06 | Upscale API retorna imagen mejorada | PASS | yes|size=442008|mime=image/jpeg | 13344ms |
| TC-07a | Rechaza messages inválido | PASS | HTTP 400 | 197ms |
| TC-07b | Upscale rechaza sin imagen | PASS | HTTP 400 | 206ms |

---

## Categorias de prueba

### 1. Health Checks (TC-01a/b/c)
Verifican que la pagina del chat, la API de MoldeGPT y la API de upscale esten accesibles.

### 2. Chat de texto (TC-02)
Valida que el agente responda a mensajes de texto simples sin invocar herramientas.

### 3. Comportamiento agentico — Auto-config (TC-03a/b/c)
Envia un mensaje con contexto de imagen y verifica que el agente invoque:
- configurarTamano — establece dimensiones del molde
- configurarPapel — selecciona formato de papel
- descargarMolde — genera el molde para descarga

### 4. Agente — Upscale (TC-04)
Verifica que al solicitar mejorar la imagen el agente invoque upscalarImagen.

### 5. Agente — Reconfiguracion (TC-05)
Envia historial previo y solicita cambio de tamano. Verifica que el agente llame configurarTamano con nuevas dimensiones.

### 6. Upscale API Directo (TC-06)
Envia una imagen PNG de 100x100px al endpoint /api/upscale y verifica que retorne una imagen mejorada.

### 7. Error Handling (TC-07a/b)
- TC-07a: Envia messages como string (no array) — espera HTTP 400
- TC-07b: Envia request sin imageBase64 — espera HTTP 400

---

## Bugs corregidos durante QA

### Bug 1: Modelo de upscale inexistente (Critico)
- **Problema:** El endpoint /api/upscale usaba gemini-2.5-flash-preview-image-generation que ya no existe (404)
- **Solucion:** Cambiar a gemini-3.1-flash-image-preview
- **Archivo:** src/app/api/upscale/route.ts

### Bug 2: Crash por respuesta sin parts (Alto)
- **Problema:** candidate.content.parts podia ser undefined, causando TypeError
- **Solucion:** Usar optional chaining candidate.content?.parts ?? []
- **Archivo:** src/app/api/upscale/route.ts

### Bug 3: IMAGE_RECITATION sin manejo (Medio)
- **Problema:** Gemini puede rechazar upscale con finishReason: IMAGE_RECITATION sin manejo
- **Solucion:** Detectar IMAGE_RECITATION y reintentar con prompt alternativo
- **Archivo:** src/app/api/upscale/route.ts

### Bug 4: responseModalities faltante (Medio)
- **Problema:** Sin responseModalities: ['Text', 'Image'], Gemini puede responder solo con texto
- **Solucion:** Agregar configuracion de modalidades de respuesta
- **Archivo:** src/app/api/upscale/route.ts

---

## Archivos de testing

| Archivo | Descripcion |
|---------|-------------|
| qa-tests.sh | Script de pruebas automatizadas (12 test cases) |
| qa-results.json | Resultados en formato JSON |
| qa-report.md | Este reporte |

---

## Notas
- El test TC-06 (upscale directo) tarda ~13s por la generacion de imagen con Gemini
- Los tests TC-03 y TC-05 dependen del comportamiento del LLM, pueden ser ligeramente flaky
- Todos los tests se ejecutan contra el ambiente de produccion en Cloud Run
