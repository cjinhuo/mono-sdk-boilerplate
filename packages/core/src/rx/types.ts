import { Observable } from './Observable'
import { Subscriber } from './Subscriber'
import { Subscription } from './Subscription'

// subscription
export interface UnSubscribable {
  unsubscribe: () => void
}

// @tiny UnSubscribable | void
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type TeardownLogic = Subscription | (() => void) | void

export interface SubscriptionLike extends UnSubscribable {
  readonly closed: boolean
}

// Observer
export interface Observer<T> {
  next: (value: T) => void
  error: (err: any) => void
  complete: () => void
}

export interface Subscribable<T> {
  subscribe: (observer: Partial<Observer<T>>) => UnSubscribable
}

export interface UnaryFunction<T, R> {
  (source: T): R
}

export interface OperatorFunction<T, R> extends UnaryFunction<Observable<T>, Observable<R>> {}

export interface MonoTypeOperatorFunction<T> extends OperatorFunction<T, T> {}

export interface Operator<_T, R> {
  call: (subscriber: Subscriber<R>, source: any) => TeardownLogic
}
