import { initializeApp } from 'firebase/app'

const firebaseConfig = {
  apiKey: 'AIzaSyBu9F5XFpj9yom6q_e02sdq7MmJdx70cv4',
  authDomain: 'stock-chenchenworkshop.firebaseapp.com',
  databaseURL: 'https://stock-chenchenworkshop-default-rtdb.firebaseio.com',
  projectId: 'stock-chenchenworkshop',
  storageBucket: 'stock-chenchenworkshop.appspot.com',
  messagingSenderId: '838881058641',
  appId: '1:838881058641:web:fdf36966523080eec77d70',
  measurementId: 'G-LDXVJCCWDD'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

//EXPORT
export default app
