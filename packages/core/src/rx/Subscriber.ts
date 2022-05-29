import { create } from 'domain'
import { isSubscription, Subscription } from './Subscription'
import { Observer } from './types'
import { isFunction, nextTick } from './utils'

export class Subscriber<T> extends Subscription implements Observer<T> {
  protected isStopped: boolean = false

  protected destination: Subscriber<T> | Observer<T>

  constructor(destination?: Subscriber<T> | Partial<Observer<T>> | ((value: T) => void) | null) {
    super()
    this.destination = isSubscriber(destination) ? destination : createSafeObserver(destination)
  }

  next(value?: T): void {
    if (this.isStopped) {
      //  execute in next setTimeout if isStopped
      // nextTick(() => this.next(value))
    } else {
      this.destination.next(value!)
    }
  }

  error(err: any): void {
    if (this.isStopped) {
      // nextTick(() => this.error(err))
    } else {
      this.isStopped = true
      try {
        this.destination.error(err)
      } finally {
        this.unsubscribe()
      }
    }
  }
  complete(): void {
    if (this.isStopped) {
      // nextTick(this.complete)
    } else {
      this.isStopped = true
      this._complete()
    }
  }
  protected _complete(): void {
    try {
      this.destination.complete()
    } finally {
      this.unsubscribe()
    }
  }
  unsubscribe(): void {
    if (!this.isStopped) {
      this.isStopped = true
      super.unsubscribe()
      this.destination = null!
    }
  }
}

class ConsumerObserver<T> implements Observer<T> {
  constructor(private partialObserver: Partial<Observer<T>>) {}

  next(value: T): void {
    const { partialObserver } = this
    if (partialObserver.next) {
      // catch error
      partialObserver.next(value)
    }
  }

  error(err: any): void {
    const { partialObserver } = this
    if (partialObserver.error) {
      // catch error
      partialObserver.error(err)
    }
  }

  complete(): void {
    const { partialObserver } = this
    if (partialObserver.complete) {
      // catch error
      partialObserver.complete()
    }
  }
}

function createSafeObserver<T>(
  observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | null
): Observer<T> {
  return new ConsumerObserver(
    !observerOrNext || isFunction(observerOrNext)
      ? { next: observerOrNext ?? undefined }
      : observerOrNext
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
