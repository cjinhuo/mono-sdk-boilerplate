import { Subscription } from './Subscription'

// subscription
export interface UnSubscribable {
  unsubscribe(): void
}

// @tiny UnSubscribable | void
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
  subscribe(observer: Partial<Observer<T>>): UnSubscribable
}
