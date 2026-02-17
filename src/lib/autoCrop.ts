/**
 * Detecta el bounding-box del contenido real de una imagen,
 * eliminando zonas blancas / vacías / transparentes de los bordes.
 *
 * @param imageSrc  Data-URL o URL de la imagen
 * @param threshold Tolerancia (0-255) para considerar un píxel como "vacío".
 *                  Valores cercanos a blanco (>threshold) se tratan como fondo.
 *                  Default: 250 (casi-blanco).
 * @param padding   Píxeles extra de margen alrededor del contenido detectado (default 2).
 * @returns         Data-URL de la imagen recortada, o null si toda la imagen es fondo.
 */
export default function autoCrop(
  imageSrc: string,
  threshold = 250,
  padding = 2
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const { width, height } = img
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No se pudo crear el contexto del canvas'))
        return
      }

      // Dibujar imagen completa
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, width, height)
      const { data } = imageData

      let minX = width
      let minY = height
      let maxX = 0
      let maxY = 0

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]
          const a = data[idx + 3]

          // Píxel es "contenido" si:
          // - No es transparente (alpha > 10)
          // - Y no es casi-blanco (algún canal está por debajo del threshold)
          const isTransparent = a < 10
          const isNearWhite = r > threshold && g > threshold && b > threshold

          if (!isTransparent && !isNearWhite) {
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
          }
        }
      }

      // Si no se encontró contenido, la imagen es totalmente vacía/blanca
      if (maxX < minX || maxY < minY) {
        resolve(null)
        return
      }

      // Aplicar padding
      minX = Math.max(0, minX - padding)
      minY = Math.max(0, minY - padding)
      maxX = Math.min(width - 1, maxX + padding)
      maxY = Math.min(height - 1, maxY + padding)

      const cropW = maxX - minX + 1
      const cropH = maxY - minY + 1

      // Crear canvas de salida recortado
      const outCanvas = document.createElement('canvas')
      outCanvas.width = cropW
      outCanvas.height = cropH
      const outCtx = outCanvas.getContext('2d')
      if (!outCtx) {
        reject(new Error('No se pudo crear el contexto del canvas de salida'))
        return
      }

      outCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH)
      resolve(outCanvas.toDataURL('image/png'))
    }

    img.onerror = () => reject(new Error('Error al cargar la imagen para autorecorte'))
    img.src = imageSrc
  })
}
