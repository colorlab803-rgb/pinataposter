import { PixelCrop } from 'react-image-crop'

// This function is required to create a new image object from a URL.
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous') // needed to avoid cross-origin issues on canvas
    image.src = url
  })

// This is the core function that performs the crop
export default async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop
): Promise<string> {
  if (!image || !crop) {
    throw new Error('Image or crop data is missing')
  }

  if (crop.width <= 0 || crop.height <= 0) {
    throw new Error('Invalid crop dimensions')
  }

  const canvas = document.createElement('canvas')
  canvas.width = crop.width
  canvas.height = crop.height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  // Verificar que la imagen esté completamente cargada
  if (!image.complete || image.naturalHeight === 0) {
    throw new Error('Image is not loaded completely')
  }

  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  
  try {
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    )

    // Return a data URI of the cropped image.
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error drawing on canvas:', error);
    throw new Error('Failed to crop image: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}
