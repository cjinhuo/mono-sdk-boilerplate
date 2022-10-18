import { Observable } from './Observable'
import { Subscriber } from './Subscriber'
import { Subscription } from './Subscription'
import { Observer, SubscriptionLike } from './types'
import { arrRemove } from './utils'

export const isSubject = (value: any): value is Subject<any> => {
  return value instanceof Subject
}

export class Subject<T> extends Observable<T> implements SubscriptionLike {
  static EMPTY = (() => {
    const empty = new Subscription()
    empty.closed = true
    return empty
  })()
  closed = false

  /** @deprecated  */
  observers: Observer<T>[] = []
  /** @deprecated  */
  isStopped = false

  /** @deprecated  */
  hasError = false
  /** @deprecated  */
  thrownError: any = null

  constructor() {
    super()
  }

  next(value: T) {
    this._throwIfClosed()
    if (!this.isStopped) {
      this.observers.forEach((observer) => observer.next(value))
    }
  }

  commonJudgement(cb: () => void) {
    this._throwIfClosed()
    if (!this.isStopped) {
      this.isStopped = true
      cb()
    }
  }

  error(err: any) {
    this.commonJudgement(() => {
      const { observers } = this
      this.hasError = true
      this.thrownError = err
      while (observers.length) {
        observers.shift()!.error(err)
      }
    })
  }

  get observed() {
    return this.observers && this.observers.length > 0
  }

  complete() {
    this.commonJudgement(() => {
      const { observers } = this
      while (observers.length) {
        observers.shift()!.complete()
      }
    })
  }

  unsubscribe() {
    this.isStopped = this.closed = true
    this.observers = null!
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
    this._checkFinalizedStatuses(subscriber)
    return this._innerSubscribe(subscriber)
  }

  /**
   * @internal may be this.stopped was already true .And if that we need to run complete or error for subscriber
   */
  protected _checkFinalizedStatuses(subscriber: Subscriber<any>) {
    const { hasError, thrownError, isStopped } = this
    if (hasError) {
      subscriber.error(thrownError)
    } else if (isStopped) {
      subscriber.complete()
    }
  }

  /** @internal */
  protected _innerSubscribe(subscriber: Subscriber<any>) {
    const { isStopped, observers } = this
    if (isStopped) {
      return Subject.EMPTY
    }
    observers.push(subscriber)
    return new Subscription(() => {
      arrRemove(observers, subscriber)
    })
  }
}
