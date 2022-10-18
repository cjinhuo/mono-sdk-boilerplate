import { Subscriber } from '../Subscriber'
import { TeardownLogic } from '../types'

export function getRegisteredFinalizers(subscription: any): Exclude<TeardownLogic, void>[] {
  if ('_finalizers' in subscription) {
    return subscription._finalizers ?? []
  } else {
    throw new TypeError('Invalid Subscription')
  }
}

/**
 * Returns a subscriber that will be deemed by this package's implementation to
 * be untrusted. The returned subscriber will fail the `instanceof Subscriber`
 * test and will not include the symbol that identifies trusted subscribers.
 */
export function asInteropSubscriber<T>(subscriber: Subscriber<T>): Subscriber<T> {
  return new Proxy(subscriber, {
    get(target: Subscriber<T>, key: string | number | symbol) {
      return Reflect.get(target, key)
    },
    getPrototypeOf(target: Subscriber<T>) {
      const { ...rest } = Object.getPrototypeOf(target)
      return rest
    },
  })
}
