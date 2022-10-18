import { Observable } from '../Observable'
import { Subscriber } from '../Subscriber'
import { OperatorFunction } from '../types'

import { isFunction } from './helper'

/**
 * If the source is not null and has a lift function, then return true, otherwise return false.
 * @param {any} source - any
 * @returns A function that takes a source and returns a boolean.
 */
export const hasLift = (source: any): source is { lift: InstanceType<typeof Observable>['lift'] } => {
  return source && isFunction(source.lift)
}

export function operate<T, R>(
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  init: (liftedSource: Observable<T>, subscriber: Subscriber<R>) => (() => void) | void,
): OperatorFunction<T, R> {
  return (source: Observable<T>) => {
    // source 是 subject
    if (hasLift(source)) {
      return source.lift(function (this: Subscriber<R>, liftedSource: Observable<T>) {
        try {
          return init(liftedSource, this)
        } catch (err) {
          this.error(err)
        }
      })
    }
    throw new TypeError('Unable to lift unknown Observable type')
  }
}
