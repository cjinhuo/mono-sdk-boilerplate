// concept https://rxjs.dev/guide/glossary-and-semantics

import { isSubscriber, Subscriber } from './Subscriber'
import { Subscription } from './Subscription'
import { Observer, Subscribable, TeardownLogic } from './types'

// Observable 可观察
export class Observable<T> implements Subscribable<T> {
  constructor(
    private _subscribe?: (this: Observable<T>, subscriber: Subscriber<T>) => TeardownLogic
  ) {}

  subscribe(observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | null): Subscription {
    const subscriber = isSubscriber(observerOrNext)
      ? observerOrNext
      : new Subscriber(observerOrNext)

    this._subscribe?.(subscriber)
    return subscriber
  }
}
