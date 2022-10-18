import { EMPTY } from '../observable/empty'
import { MonoTypeOperatorFunction } from '../types'
import { operate } from '../utils'

export function take<T>(count: number): MonoTypeOperatorFunction<T> {
  return count <= 0
    ? () => EMPTY
    : operate((source, subscriber) => {
        let runCount = 0
        source.subscribe((val) => {
          if (++runCount <= count) {
            subscriber.next(val)
            if (count <= runCount) {
              subscriber.complete()
            }
          }
        })
        return () => {
          console.log('take return ')
        }
      })
}
