import { Storage } from '@google-cloud/storage'

const PROJECT_ID = 'rutas-488705'
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'pinataposter-media'

let storage: Storage
let bucketRef: ReturnType<Storage['bucket']>

function getStorage(): Storage {
  if (!storage) {
    storage = new Storage({ projectId: PROJECT_ID })
  }
  return storage
}

function getBucket() {
  if (!bucketRef) {
    bucketRef = getStorage().bucket(BUCKET_NAME)
  }
  return bucketRef
}

export async function uploadImage(
  buffer: Buffer,
  path: string,
  contentType: string
): Promise<string> {
  const bucket = getBucket()
  const file = bucket.file(path)

  await file.save(buffer, {
    metadata: { contentType, cacheControl: 'public, max-age=31536000' },
    public: true,
  })

  return `https://storage.googleapis.com/${BUCKET_NAME}/${path}`
}

export async function deleteImage(path: string): Promise<void> {
  const bucket = getBucket()
  const file = bucket.file(path)
  try {
    await file.delete()
  } catch {
    // Ignorar si el archivo no existe
  }
}

export async function deleteImages(paths: string[]): Promise<void> {
  await Promise.all(paths.map(deleteImage))
}

export function getPublicUrl(path: string): string {
  return `https://storage.googleapis.com/${BUCKET_NAME}/${path}`
}

export function extractPathFromUrl(url: string): string | null {
  const prefix = `https://storage.googleapis.com/${BUCKET_NAME}/`
  if (!url.startsWith(prefix)) return null
  return url.slice(prefix.length)
}
