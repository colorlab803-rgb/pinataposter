'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  getIdToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getFirebaseAuth()
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth()
    await signInWithEmailAndPassword(auth, email, password)
  }, [])

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const auth = getFirebaseAuth()
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(credential.user, { displayName })
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth()
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }, [])

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth()
    await firebaseSignOut(auth)
  }, [])

  const getIdToken = useCallback(async () => {
    if (!user) return null
    return user.getIdToken()
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut, getIdToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
