# PiñataPoster

Divide cualquier imagen para imprimirla a gran escala en varias hojas. Ideal para posters, pinatas, patrones y manualidades.

## Stack

- **Next.js 15** (App Router, Turbopack)
- **React 18** + Tailwind CSS
- **jsPDF** + **JSZip** para generacion de PDF/ZIP
- **react-image-crop** para recorte de imagenes

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Funcionalidades

- Sube cualquier imagen (JPG, PNG)
- Recorta la imagen antes de dividir
- Define el tamano final en cm o por numero de hojas
- Soporta hojas: Carta, Oficio, Tabloide, A4, A3
- Orientacion vertical u horizontal
- Guias de corte y sangrado para pegado perfecto
- Plano de armado automatico
- Descarga en PDF o ZIP
- Dark/Light mode
