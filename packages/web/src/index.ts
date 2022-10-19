import { add, Subject, interval } from '@boilerplate/core'
export const multiply = (a: number, b: number) => {
  const sum = add(a, b)
  return sum * sum
}

export { interval }
