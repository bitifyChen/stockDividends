import { create, all } from 'mathjs'

const config = {
  number: 'BigNumber',
  precision: 20
}
const math = create(all, config)
//+
export const add = (num1, num2) => {
  return Number(math.format(math.add(math.bignumber(num1), math.bignumber(num2))))
}
//-
export const subtract = (num1, num2) => {
  return Number(math.format(math.subtract(math.bignumber(num1), math.bignumber(num2))))
}
//*
export const multiply = (num1, num2) => {
  return Number(math.format(math.multiply(math.bignumber(num1), math.bignumber(num2))))
}
//%
export const divide = (num1, num2) => {
  return Number(math.format(math.divide(math.bignumber(num1), math.bignumber(num2))))
}

export const round = (value, unit = 0) => {
  return math.format(math.round(value, unit))
}
