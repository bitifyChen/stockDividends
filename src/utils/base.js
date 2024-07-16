export const keysToKeep = (orgObj, keyArr) => {
  return keyArr.reduce((obj, key) => {
    if (orgObj.hasOwnProperty(key)) {
      obj[key] = orgObj[key]
    }
    return obj
  }, {})
}
