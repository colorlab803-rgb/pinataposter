import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getAuth as getAdminAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore as getAdminFirestore, type Firestore } from 'firebase-admin/firestore'

const PROJECT_ID = 'rutas-488705'

let app: App
let auth: Auth
let db: Firestore

function getAdminApp(): App {
  if (!app) {
    if (getApps().length > 0) {
      app = getApps()[0]
    } else {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      if (serviceAccountKey) {
        const serviceAccount = JSON.parse(serviceAccountKey)
        app = initializeApp({ credential: cert(serviceAccount), projectId: PROJECT_ID })
      } else {
        app = initializeApp({ projectId: PROJECT_ID })
      }
    }
  }
  return app
}

export function getFirebaseAdminAuth(): Auth {
  if (!auth) {
    auth = getAdminAuth(getAdminApp())
  }
  return auth
}

export function getFirebaseAdminFirestore(): Firestore {
  if (!db) {
    db = getAdminFirestore(getAdminApp())
  }
  return db
}

export async function verifyIdToken(token: string) {
  const adminAuth = getFirebaseAdminAuth()
  return adminAuth.verifyIdToken(token)
}

export async function getUserFromRequest(request: Request): Promise<{ uid: string; email: string } | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  try {
    const token = authHeader.split('Bearer ')[1]
    const decoded = await verifyIdToken(token)
    return { uid: decoded.uid, email: decoded.email || '' }
  } catch {
    return null
  }
}
