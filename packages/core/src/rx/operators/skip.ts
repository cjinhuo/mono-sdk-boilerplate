import { MonoTypeOperatorFunction } from '../types'

import { filter } from './filter'

export function skip<T>(count: number): MonoTypeOperatorFunction<T> {
  return filter((_, index) => count <= index)
}
