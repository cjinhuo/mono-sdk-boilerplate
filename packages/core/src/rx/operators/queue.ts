import { MonoTypeOperatorFunction } from '../types'
import { operate } from '../utils'

export function queue<T>(predicate: (value: T, index: number) => boolean, thisArg?: any): MonoTypeOperatorFunction<T> {
  return operate((source, subscriber) => {
    // An index passed to our predicate function on each call.
    let index = 0

    source.subscribe((val) => predicate.call(thisArg, val, index++) && subscriber.next(val))
  })
}
