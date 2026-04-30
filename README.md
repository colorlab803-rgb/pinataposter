# PiñataPoster

Divide cualquier imagen para imprimirla a gran escala en varias hojas.
Ideal para posters, piñatas, patrones y manualidades.

**Pago anual de $50 MXN: 12 meses de PiñataPoster ilimitado.**

🌐 **https://pinataposter.com**

## Funcionalidades

- Sube cualquier imagen (JPG, PNG)
- Recorta la imagen antes de dividir
- Define el tamaño final en cm o por número de hojas
- Soporta hojas: Carta, Oficio, Tabloide, A4, A3
- Orientación vertical u horizontal
- Guías de corte y sangrado para pegado perfecto
- Plano de armado automático
- Descarga en PDF o ZIP con acceso anual activo
- Dark/Light mode

## Stack

- **Next.js 15** (App Router, standalone output)
- **React 18** + Tailwind CSS
- **jsPDF** + **JSZip** para generación de PDF/ZIP
- **react-image-crop** para recorte de imágenes

## Desarrollo local

```bash
npm install
npm run dev
```

## Despliegue (Docker)

```bash
docker compose up -d --build
```

La app corre en `localhost:3010` y se expone a internet vía Cloudflare Tunnel.

### Arquitectura en producción

```
Internet → Cloudflare (DNS + TLS) → Tunnel → Contabo VPS → localhost:3010
```

- **Servidor**: Contabo VPS (212.28.191.156)
- **Container**: Docker multi-stage (node:20-alpine)
- **Puerto**: 127.0.0.1:3010 → 3000 (interno)
- **Tunnel**: cloudflared systemd service
- **Dominio**: pinataposter.com (Cloudflare DNS)
