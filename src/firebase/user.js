import app from './index.js'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
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
