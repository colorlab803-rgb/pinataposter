import { Firestore } from '@google-cloud/firestore'

let firestore: Firestore

export function getFirestore(): Firestore {
  if (!firestore) {
    firestore = new Firestore({
      projectId: 'rutas-488705',
      databaseId: '(default)',
    })
  }
  return firestore
}
