import { add } from '@mono/core'
export const multiply = (a: number, b: number) => {
  const sum = add(a, b)
  return sum * sum
}
