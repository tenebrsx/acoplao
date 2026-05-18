import 'server-only'
import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

let adminApp: App

function getAdminApp(): App {
  if (!adminApp) {
    if (getApps().length > 0) {
      adminApp = getApps()[0]
    } else {
      const projectId = process.env.FIREBASE_PROJECT_ID
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
          'Firebase Admin env vars missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.'
        )
      }

      adminApp = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      })
    }
  }
  return adminApp
}

export function getAdminAuth() {
  return getAuth(getAdminApp())
}

/**
 * Verify a Firebase session cookie and return the decoded claims.
 * Returns null if invalid or expired.
 */
export async function verifySessionCookie(sessionCookie: string) {
  try {
    return await getAdminAuth().verifySessionCookie(sessionCookie, true)
  } catch {
    return null
  }
}

/**
 * Create a long-lived Firebase session cookie from an ID token.
 */
export async function createAuthSessionCookie(idToken: string, expiresIn: number) {
  return await getAdminAuth().createSessionCookie(idToken, { expiresIn })
}
