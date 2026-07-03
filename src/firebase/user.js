import app from './index.js'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile
} from 'firebase/auth'
import { getFirestore, doc, getDoc } from 'firebase/firestore'

const auth = getAuth(app)
const db = getFirestore(app)

const getUserProfile = async (uid) => {
  if (!uid) return {}

  try {
    const [userSnap, profileSnap] = await Promise.all([
      getDoc(doc(db, 'users', uid)),
      getDoc(doc(db, 'users', uid, 'settings', 'profile'))
    ])

    return {
      ...(userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : {}),
      ...(profileSnap.exists() ? profileSnap.data() : {})
    }
  } catch (error) {
    console.warn('Firebase user profile read failed:', error)
    return {}
  }
}

const normalizeUser = async (user) => {
  const profile = await getUserProfile(user?.uid)
  const roles = Array.isArray(profile.roles) ? profile.roles : []
  const superuser =
    profile.superuser === true ||
    profile.role === 'superuser' ||
    profile.role === 'admin' ||
    roles.includes('superuser') ||
    roles.includes('admin')

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    ...profile,
    roles,
    superuser
  }
}

export const postUser = ({ email, password }) => {
  return new Promise((resolve, reject) => {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user
        // Create a document for the user in Firestore
        resolve(user)
      })
      .catch((error) => {
        reject(error)
      })
  })
}

export const patchUser = (params) => {
  return new Promise((resolve, reject) => {
    const user = auth.currentUser
    updateProfile(user, params)
      .then(() => {
        resolve({ status: 200 })
      })
      .catch((error) => {
        reject(error)
      })
  })
}

export const postUserLogin = ({ email, password }) => {
  return new Promise((resolve, reject) => {
    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = await normalizeUser(userCredential.user)
        resolve(user)
      })
      .catch((error) => {
        reject(error)
      })
  })
}

export const postUserLogout = () => {
  return new Promise((resolve, reject) => {
    signOut(auth)
      .then(() => {
        resolve()
      })
      .catch((error) => {
        reject(error)
      })
  })
}

export const checkUser = () => {
  return new Promise((resolve, reject) => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        resolve(await normalizeUser(user))
      } else {
        reject(user)
      }
    })
  })
}
