import { isSubscription, Subscription } from './Subscription'
import { Observer } from './types'
import { isFunction } from './utils'

export class Subscriber<T> extends Subscription implements Observer<T> {
  protected isStopped = false

  protected destination: Subscriber<T> | Observer<T>

  constructor(destination?: Subscriber<T> | Partial<Observer<T>> | ((value: T) => void) | null) {
    super()
    this.destination = isSubscriber(destination) ? destination : createSafeObserver(destination)
  }

  next(value?: T): void {
    if (!this.isStopped) {
      this.destination.next(value!)
    }
  }

  error(err?: any): void {
    if (!this.isStopped) {
      this.isStopped = true
      try {
        this.destination.error(err)
      } finally {
        this.unsubscribe()
      }
    }
  }
  complete(): void {
    if (!this.isStopped) {
      this.isStopped = true
      this._complete()
    }
  }
  unsubscribe(): void {
    // here used subscription's field
    if (!this.closed) {
      this.isStopped = true
      super.unsubscribe()
      this.destination = null!
    }
  }
  protected _complete(): void {
    try {
      this.destination.complete()
    } finally {
      this.unsubscribe()
    }
  }
}

class ConsumerObserver<T> implements Observer<T> {
  constructor(private readonly partialObserver: Partial<Observer<T>>) {}

  next(value: T): void {
    const { partialObserver } = this
    if (partialObserver.next) {
      try {
        partialObserver.next(value)
      } catch (error) {
        // catch subject/observable errors
        console.error('ConsumerObserver.next error', error)
      }
    }
  }

  error(err: any): void {
    const { partialObserver } = this
    if (partialObserver.error) {
      try {
        partialObserver.error(err)
      } catch (error) {
        console.error('ConsumerObserver.error error', error)
      }
    }
  }

  complete(): void {
    const { partialObserver } = this
    if (partialObserver.complete) {
      try {
        partialObserver.complete()
      } catch (error) {
        console.error('ConsumerObserver.complete error', error)
      }
    }
  }
}

function createSafeObserver<T>(observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | null): Observer<T> {
  return new ConsumerObserver(
    !observerOrNext || isFunction(observerOrNext) ? { next: observerOrNext ?? undefined } : observerOrNext,
  )
}

function isObserver<T>(value: any): value is Observer<T> {
  return value && isFunction(value.next) && isFunction(value.error) && isFunction(value.complete)
}

/**
 * optimize original rxjs: (value && value instanceof Subscriber)
 * @param value
 * @returns
 */
export function isSubscriber<T>(value: any): value is Subscriber<T> {
  return value instanceof Subscriber || (value && isObserver(value) && isSubscription(value))
}
