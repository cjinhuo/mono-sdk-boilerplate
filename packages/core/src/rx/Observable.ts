// concept https://rxjs.dev/guide/glossary-and-semantics
// Observable 可观察

import { TeardownLogic } from 'rxjs'

// observable 是Observable的实例
export class Observable<T> {
  _subscribe: Subscriber<T>
  constructor(_subscribe: Subscriber<T>) {
    this._subscribe = _subscribe
  }
  subscribe(observer: Observer<T>): any {
    const subscriber = new Subscriber(observer)
    this._subscribe.add(subscriber)
    this._subscribe(subscriber)
  }
}

class Subscription {
  closed = false
  _teardown: any[] = []
  constructor() {
    this._teardown = []
  }
  unsubscribe() {
    this._teardown.forEach((teardown) => typeof teardown === 'function' && teardown())
  }
  add(teardown) {
    if (teardown) {
      this._teardown.push(teardown)
    }
  }
}

class Subscriber<T> extends Subscription {
  isStopped = false
  observer: Observer<T>
  constructor(observer: Observer<T>): TeardownLogic {
    super()
    this.observer = observer
    this.isStopped = false
  }
  next(value: any) {
    if (this.observer.next && !this.isStopped) {
      this.observer.next(value)
    }
  }
  error(err: any) {
    this.isStopped = true
  }
  complete() {
    this.isStopped = true
    if (this.observer.complete) {
      this.observer.complete()
    }
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  }
}

export interface Observer<T> {
  next: (_: T) => void
  error: (_: any) => void
  complete: () => void
}

export interface SubscriptionLike {
  unsubscribe(): void
  readonly closed: boolean
}
