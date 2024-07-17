import app from './index.js'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile
} from 'firebase/auth'
import { getFirestore, doc } from 'firebase/firestore'

const auth = getAuth(app)
const db = getFirestore(app)

export const postUser = ({ email, password }) => {
  return new Promise((resolve, reject) => {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user
        // Create a document for the user in Firestore
        doc(db, `users${user.uid}`).then(() => {
          resolve(user)
        })
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
      .then((userCredential) => {
        const user = userCredential.user
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
    auth.onAuthStateChanged((user) => {
      if (user) {
        resolve(user)
      } else {
        reject(user)
      }
    })
  })
}
