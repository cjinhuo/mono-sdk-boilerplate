import { Observable } from './Observable'
import { Subscriber } from './Subscriber'
import { Subscription } from './Subscription'
import { Observer, SubscriptionLike } from './types'

export class Subject<T> extends Observable<T> implements SubscriptionLike {
  public static EMPTY = (() => {
    const empty = new Subscription()
    empty.closed = true
    return empty
  })()
  closed = false

  // private currentObservers: Observer<T>[] | null = null

  /** @deprecated Internal implementation detail, do not use directly. Will be made internal in v8. */
  observers: Set<Observer<T>> = new Set()
  /** @deprecated Internal implementation detail, do not use directly. Will be made internal in v8. */
  isStopped = false

  constructor() {
    super()
  }

  next(value: T) {
    this._throwIfClosed()
    if (!this.isStopped) {
      for (const observer of this.observers) {
        observer.next(value)
      }
    }
  }

  commonJudgement(cb: () => void) {
    this._throwIfClosed()
    if (!this.isStopped) {
      cb()
    }
  }

  error(err: any) {
    this.commonJudgement(() => {
      const { observers } = this
      for (const observer of observers) {
        observer.error(err)
        observers.delete(observer)
      }
    })
  }

  complete() {
    this.commonJudgement(() => {
      const { observers } = this
      for (const observer of observers) {
        observer.complete()
        observers.delete(observer)
      }
    })
  }

  unsubscribe() {
    this.isStopped = this.closed = true
    this.observers = null!
    // this.observers = this.currentObservers = null!
  }

  /** @internal */
  protected _throwIfClosed() {
    if (this.closed) {
      console.error('current subject is closed')
    }
  }

  /** @internal */
  protected _subscribe(subscriber: Subscriber<T>): Subscription {
    this._throwIfClosed()
    // this._checkFinalizedStatuses(subscriber)
    return this._innerSubscribe(subscriber)
  }

  /** @internal */
  protected _innerSubscribe(subscriber: Subscriber<any>) {
    const { isStopped, observers } = this
    if (isStopped) {
      return Subject.EMPTY
    }
    // this.currentObservers = null
    observers.add(subscriber)
    return new Subscription(() => {
      // this.currentObservers = null
      observers.delete(subscriber)
    })
  }
}
