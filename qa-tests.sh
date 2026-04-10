#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# QA Testing — MoldeGPT (PinataPoster Chat)
# Fecha: 2026-04-09
# Target: https://pinataposter-58669055557.us-central1.run.app
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

BASE_URL="https://pinataposter-58669055557.us-central1.run.app"
RESULTS_FILE="qa-results.json"
REPORT_FILE="qa-report.md"

# 100x100 pattern PNG for upscale testing
TEST_IMAGE="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"

PASS=0
FAIL=0
TOTAL=0
RESULTS="[]"

log_result() {
  local id="$1" name="$2" status="$3" detail="$4" duration="$5"
  TOTAL=$((TOTAL + 1))
  if [ "$status" = "PASS" ]; then PASS=$((PASS + 1)); else FAIL=$((FAIL + 1)); fi
  RESULTS=$(echo "$RESULTS" | python3 -c "
import json, sys
r = json.load(sys.stdin)
r.append({'id': '$id', 'name': '$name', 'status': '$status', 'detail': '''$detail''', 'duration_ms': $duration})
json.dump(r, sys.stdout)
")
  local icon="✅"
  [ "$status" = "FAIL" ] && icon="❌"
  echo "$icon $id: $name — $status ($duration ms)"
}

# ─── TC-01: Health Checks ───────────────────────────────────
echo ""
echo "═══ TC-01: Health Checks ═══"

START=$(date +%s%N)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/chat")
DUR=$(( ($(date +%s%N) - START) / 1000000 ))
if [ "$HTTP_CODE" = "200" ]; then
  log_result "TC-01a" "Chat page loads" "PASS" "HTTP $HTTP_CODE" "$DUR"
else
  log_result "TC-01a" "Chat page loads" "FAIL" "Expected 200, got $HTTP_CODE" "$DUR"
fi

START=$(date +%s%N)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/molde-ia" -H "Content-Type: application/json" -d '{}')
DUR=$(( ($(date +%s%N) - START) / 1000000 ))
if [ "$HTTP_CODE" = "400" ]; then
  log_result "TC-01b" "MoldeGPT API reachable" "PASS" "HTTP $HTTP_CODE (expected 400 for empty body)" "$DUR"
else
  log_result "TC-01b" "MoldeGPT API reachable" "FAIL" "Expected 400, got $HTTP_CODE" "$DUR"
fi

START=$(date +%s%N)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/upscale" -H "Content-Type: application/json" -d '{}')
DUR=$(( ($(date +%s%N) - START) / 1000000 ))
if [ "$HTTP_CODE" = "400" ]; then
  log_result "TC-01c" "Upscale API reachable" "PASS" "HTTP $HTTP_CODE (expected 400 for empty body)" "$DUR"
else
  log_result "TC-01c" "Upscale API reachable" "FAIL" "Expected 400, got $HTTP_CODE" "$DUR"
fi

# ─── TC-02: Chat text-only — saludo ─────────────────────────
echo ""
echo "═══ TC-02: Chat Text Only — Saludo ═══"

START=$(date +%s%N)
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/molde-ia" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hola, ¿qué puedes hacer?"}],
    "generatorState": {"tieneImagen": false}
  }')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
DUR=$(( ($(date +%s%N) - START) / 1000000 ))

HAS_TEXT=$(echo "$BODY" | python3 -c "
import json, sys
has_text = False
text = ''
for line in sys.stdin:
    if line.startswith('data: ') and line.strip() != 'data: [DONE]':
        try:
            d = json.loads(line[6:])
            if d.get('type') == 'text' and d.get('content'):
                has_text = True
                text += d['content']
        except: pass
print('yes|' + text[:100].replace('\n', ' ') if has_text else 'no')
" 2>/dev/null || echo "error|error")

TEXT_STATUS=$(echo "$HAS_TEXT" | cut -d'|' -f1)
if [ "$HTTP_CODE" = "200" ] && [ "$TEXT_STATUS" = "yes" ]; then
  TEXT_PREVIEW=$(echo "$HAS_TEXT" | cut -d'|' -f2)
  log_result "TC-02" "Chat responde a saludo" "PASS" "$TEXT_PREVIEW" "$DUR"
else
  log_result "TC-02" "Chat responde a saludo" "FAIL" "HTTP=$HTTP_CODE hasText=$TEXT_STATUS" "$DUR"
fi

# ─── TC-03: Agente — auto-configuración con imagen ──────────
echo ""
echo "═══ TC-03: Agent — Auto-config con imagen ═══"

START=$(date +%s%N)
RESP=$(curl -s -w "\n%{http_code}" --max-time 60 -X POST "$BASE_URL/api/molde-ia" \
  -H "Content-Type: application/json" \
  -d "{
    \"messages\": [{\"role\": \"user\", \"content\": \"Aquí está mi imagen. Sin importar lo que parezca, hazme automáticamente el molde de 80x60 en papel Letter y orientación portrait usando las herramientas de una sola vez.\"}],
    \"imageBase64\": \"$TEST_IMAGE\",
    \"imageMimeType\": \"image/png\",
    \"generatorState\": {\"tieneImagen\": true}
  }")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
DUR=$(( ($(date +%s%N) - START) / 1000000 ))

TOOL_ANALYSIS=$(echo "$BODY" | python3 -c "
import json, sys
try:
    calls = []
    for line in sys.stdin:
        if line.startswith('data: ') and line.strip() != 'data: [DONE]':
            try:
                d = json.loads(line[6:])
                if d.get('type') == 'tool_calls':
                    calls.extend(d.get('calls', []))
            except: pass
    names = [c['name'] for c in calls]
    has_tamano = 'configurarTamano' in names
    has_papel = 'configurarPapel' in names
    has_descarga = 'descargarMolde' in names
    print(f'tamano={has_tamano}|papel={has_papel}|descarga={has_descarga}|total={len(calls)}|names={\",\".join(names)}')
except Exception as e:
    print(f'error={e}')
" 2>/dev/null)

HAS_TAMANO=$(echo "$TOOL_ANALYSIS" | grep -o 'tamano=True' || true)
HAS_PAPEL=$(echo "$TOOL_ANALYSIS" | grep -o 'papel=True' || true)
HAS_DESCARGA=$(echo "$TOOL_ANALYSIS" | grep -o 'descarga=True' || true)

if [ "$HTTP_CODE" = "200" ] && [ -n "$HAS_TAMANO" ] && [ -n "$HAS_PAPEL" ]; then
  log_result "TC-03a" "Agente llama configurarTamano" "PASS" "$TOOL_ANALYSIS" "$DUR"
else
  log_result "TC-03a" "Agente llama configurarTamano" "FAIL" "HTTP=$HTTP_CODE $TOOL_ANALYSIS" "$DUR"
fi

if [ -n "$HAS_PAPEL" ]; then
  log_result "TC-03b" "Agente llama configurarPapel" "PASS" "$TOOL_ANALYSIS" "0"
else
  log_result "TC-03b" "Agente llama configurarPapel" "FAIL" "$TOOL_ANALYSIS" "0"
fi

if [ -n "$HAS_DESCARGA" ]; then
  log_result "TC-03c" "Agente llama descargarMolde" "PASS" "$TOOL_ANALYSIS" "0"
else
  log_result "TC-03c" "Agente llama descargarMolde" "FAIL" "$TOOL_ANALYSIS" "0"
fi

# Guardar respuesta completa para el reporte
echo "$BODY" > /tmp/qa-tc03-response.json

# ─── TC-04: Agente — solicitud de upscale ────────────────────
echo ""
echo "═══ TC-04: Agent — Solicitud de upscale ═══"

START=$(date +%s%N)
RESP=$(curl -s -w "\n%{http_code}" --max-time 60 -X POST "$BASE_URL/api/molde-ia" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Aquí está mi imagen de piñata"},
      {"role": "assistant", "content": "¡Tu piñata se ve genial! Ya configuré el molde de 70x50cm en papel Letter vertical y generé el PDF. 🪅"},
      {"role": "user", "content": "Necesito que ejecutes obligatoriamente la función upscalarImagen/tool_call ahora mismo."}
    ],
    "generatorState": {"tieneImagen": true}
  }')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
DUR=$(( ($(date +%s%N) - START) / 1000000 ))

HAS_UPSCALE=$(echo "$BODY" | python3 -c "
import json, sys
try:
    calls = []
    for line in sys.stdin:
        if line.startswith('data: ') and line.strip() != 'data: [DONE]':
            try:
                d = json.loads(line[6:])
                if d.get('type') == 'tool_calls':
                    calls.extend(d.get('calls', []))
            except: pass
    names = [c['name'] for c in calls]
    print('yes' if 'upscalarImagen' in names else 'no')
except:
    print('error')
" 2>/dev/null)

if [ "$HTTP_CODE" = "200" ] && [ "$HAS_UPSCALE" = "yes" ]; then
  log_result "TC-04" "Agente invoca upscalarImagen" "PASS" "upscalarImagen tool call presente" "$DUR"
else
  DETAIL=$(echo "$BODY" | python3 -c "
import json, sys
text = ''
for line in sys.stdin:
    if line.startswith('data: ') and line.strip() != 'data: [DONE]':
        try:
            d = json.loads(line[6:])
            if d.get('type') == 'text' and d.get('content'):
                text += d['content']
        except: pass
print(text[:150].replace('\n', ' '))
" 2>/dev/null || echo "No text extracted")
  log_result "TC-04" "Agente invoca upscalarImagen" "FAIL" "HTTP=$HTTP_CODE upscale=$HAS_UPSCALE detail=$DETAIL" "$DUR"
fi

echo "$BODY" > /tmp/qa-tc04-response.json

# ─── TC-05: Agente — cambio de tamaño ───────────────────────
echo ""
echo "═══ TC-05: Agent — Cambio de tamaño ═══"

START=$(date +%s%N)
RESP=$(curl -s -w "\n%{http_code}" --max-time 60 -X POST "$BASE_URL/api/molde-ia" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hazme un molde de piñata"},
      {"role": "assistant", "content": "Configuré un molde de 70x50cm en Letter vertical."},
      {"role": "user", "content": "Cambia el tamaño a 120cm de alto y 80cm de ancho por favor"}
    ],
    "generatorState": {"tieneImagen": true}
  }')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
DUR=$(( ($(date +%s%N) - START) / 1000000 ))

SIZE_ANALYSIS=$(echo "$BODY" | python3 -c "
import json, sys
try:
    calls = []
    for line in sys.stdin:
        if line.startswith('data: ') and line.strip() != 'data: [DONE]':
            try:
                d = json.loads(line[6:])
                if d.get('type') == 'tool_calls':
                    calls.extend(d.get('calls', []))
            except: pass
    for c in calls:
        if c['name'] == 'configurarTamano':
            alto = c['args'].get('alto', 0)
            ancho = c['args'].get('ancho', 0)
            print(f'yes|alto={alto}|ancho={ancho}')
            sys.exit()
    print('no|no_tamano_call')
except Exception as e:
    print(f'error|{e}')
" 2>/dev/null)

HAS_SIZE=$(echo "$SIZE_ANALYSIS" | cut -d'|' -f1)
if [ "$HTTP_CODE" = "200" ] && [ "$HAS_SIZE" = "yes" ]; then
  log_result "TC-05" "Agente reconfigura tamaño grande" "PASS" "$SIZE_ANALYSIS" "$DUR"
else
  log_result "TC-05" "Agente reconfigura tamaño grande" "FAIL" "HTTP=$HTTP_CODE $SIZE_ANALYSIS" "$DUR"
fi

echo "$BODY" > /tmp/qa-tc05-response.json

# ─── TC-06: Upscale API directo ──────────────────────────────
echo ""
echo "═══ TC-06: Upscale API Directo ═══"

START=$(date +%s%N)
RESP=$(curl -s -w "\n%{http_code}" --max-time 120 -X POST "$BASE_URL/api/upscale" \
  -H "Content-Type: application/json" \
  -d "{\"imageBase64\": \"$TEST_IMAGE\", \"mimeType\": \"image/png\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
DUR=$(( ($(date +%s%N) - START) / 1000000 ))

UPSCALE_RESULT=$(echo "$BODY" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    if d.get('imageBase64'):
        size = len(d['imageBase64'])
        mime = d.get('mimeType', 'unknown')
        print(f'yes|size={size}|mime={mime}')
    elif d.get('error'):
        print(f'error|{d[\"error\"]}')
    else:
        print('no|empty_response')
except Exception as e:
    print(f'parse_error|{e}')
" 2>/dev/null)

UPSCALE_OK=$(echo "$UPSCALE_RESULT" | cut -d'|' -f1)
if [ "$HTTP_CODE" = "200" ] && [ "$UPSCALE_OK" = "yes" ]; then
  log_result "TC-06" "Upscale API retorna imagen mejorada" "PASS" "$UPSCALE_RESULT" "$DUR"
else
  log_result "TC-06" "Upscale API retorna imagen mejorada" "FAIL" "HTTP=$HTTP_CODE $UPSCALE_RESULT" "$DUR"
fi

# ─── TC-07: Error handling ───────────────────────────────────
echo ""
echo "═══ TC-07: Error Handling ═══"

START=$(date +%s%N)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/molde-ia" \
  -H "Content-Type: application/json" \
  -d '{"messages": "not_an_array"}')
DUR=$(( ($(date +%s%N) - START) / 1000000 ))
if [ "$HTTP_CODE" = "400" ]; then
  log_result "TC-07a" "Rechaza messages inválido" "PASS" "HTTP $HTTP_CODE" "$DUR"
else
  log_result "TC-07a" "Rechaza messages inválido" "FAIL" "Expected 400, got $HTTP_CODE" "$DUR"
fi

START=$(date +%s%N)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/upscale" \
  -H "Content-Type: application/json" \
  -d '{"mimeType": "image/png"}')
DUR=$(( ($(date +%s%N) - START) / 1000000 ))
if [ "$HTTP_CODE" = "400" ]; then
  log_result "TC-07b" "Upscale rechaza sin imagen" "PASS" "HTTP $HTTP_CODE" "$DUR"
else
  log_result "TC-07b" "Upscale rechaza sin imagen" "FAIL" "Expected 400, got $HTTP_CODE" "$DUR"
fi

# ─── Generar JSON de resultados ──────────────────────────────
echo ""
echo "═══════════════════════════════════════"
echo "📊 Resultados: $PASS/$TOTAL PASS — $FAIL FAIL"
echo "═══════════════════════════════════════"

echo "$RESULTS" | python3 -m json.tool > "$RESULTS_FILE"
echo "📄 Resultados guardados en $RESULTS_FILE"
