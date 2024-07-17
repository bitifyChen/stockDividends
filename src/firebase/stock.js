import app from './index.js'
import { postPrice } from '@/api/price.js'
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore'

import { useCookies } from '@vueuse/integrations/useCookies'
const cookies = useCookies(['token'])

const db = getFirestore(app)
const useUserStockRef = () => {
  const _token = cookies.get('token')
  const userRef = doc(db, 'users', _token)
  const userStockRef = collection(userRef, 'stock')
  return userStockRef
}

export const postStock = (params) => {
  return new Promise((resolve, reject) => {
    try {
      const res = setDoc(doc(useUserStockRef()), {
        ...params,
        createDate: serverTimestamp()
      })
      //加入firebase創建股票
      setDoc(doc(db, 'stocks', params.stockId), {}, { merge: true })
      //加入google sheet完成監聽
      postPrice(params.stockId)
      resolve({ status: 200, data: res })
    } catch (error) {
      reject(error)
    }
  })
}

export const getStock = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const querySnapshot = await getDocs(useUserStockRef())
      // 使用 map 方法创建包含所有股票数据的数组
      const userData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
      resolve({ status: 200, data: userData }) // 成功时返回包含所有股票数据的数组
    } catch (error) {
      reject(error) // 失败时返回错误
    }
  })
}
export const patchStock = (id, params) => {
  return new Promise(async (resolve, reject) => {
    try {
      const userStockIdRef = doc(useUserStockRef(), id)
      await updateDoc(userStockIdRef, params)
      resolve({ status: 200 })
    } catch (error) {
      reject(error)
    }
  })
}
export const deleteStock = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const userStockIdRef = doc(useUserStockRef(), id)
      await deleteDoc(userStockIdRef)
      resolve({ status: 200 }) // 成功时返回空
    } catch (error) {
      reject(error)
    }
  })
}

export const getStockDividend = async (stockId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const stockRef = doc(db, 'stocks', stockId)
      const dividendStockRef = collection(stockRef, 'dividend')
      const querySnapshot = await getDocs(dividendStockRef)
      // 使用 map 方法创建包含所有股票数据的数组
      const data = querySnapshot.docs.map((doc) => ({
        ...doc.data()
      }))
      resolve({ status: 200, data: data }) // 成功时返回包含所有股票数据的数组
    } catch (error) {
      reject(error) // 失败时返回错误
    }
  })
}
