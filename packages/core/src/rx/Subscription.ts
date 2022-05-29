import { SubscriptionLike, TeardownLogic, UnSubscribable } from './types'
import { isFunction } from './utils'

const execFinalizer = (finalizer: UnSubscribable | (() => void)) => {
  if (isFunction(finalizer)) {
    finalizer()
  } else {
    finalizer && finalizer.unsubscribe()
  }
}

export const isSubscription = (value: any): value is Subscription => {
  return (
    value instanceof Subscription
    // is that necessary?
    // ||
    // (value &&
    //   'closed' in value &&
    //   isFunction(value.remove) &&
    //   isFunction(value.add) &&
    //   isFunction(value.unsubscribe))
  )
}

export class Subscription implements SubscriptionLike {
  // @remove
  // public static EMPTY = (() => {
  //   const empty = new Subscription()
  //   empty.closed = true
  //   return empty
  // })()
  /**
   * A flag to indicate whether this Subscription has already been unsubscribed.
   */
  public closed = false

  private _parentageSet: Set<Subscription> | null = null

  // may be waste a tiny of memory，but set initial value can effectively reduce the following code judgment statements
  private _finalizerSet: Set<Exclude<TeardownLogic, void>> | null = null

  constructor(private initialTeardown?: () => void) {}

  unsubscribe(): void {
    // @tiny
    // let errors: any[] | undefined
    if (!this.closed) {
      this.closed = true
      const { _parentageSet, _finalizerSet, initialTeardown } = this
      if (_parentageSet) {
        this._parentageSet = null
        for (const parent of _parentageSet) {
          parent.remove(this)
        }
      }

      if (isFunction(initialTeardown)) {
        initialTeardown()
      }

      if (_finalizerSet) {
        this._finalizerSet = null
        for (const finalizer of _finalizerSet) {
          execFinalizer(finalizer)
        }
      }
    }
  }

  remove(teardown: Exclude<TeardownLogic, void>): void {
    this._finalizerSet?.delete(teardown)

    if (teardown instanceof Subscription) {
      teardown._removeParent(this)
    }
  }

  add(teardown: TeardownLogic): void {
    if (!teardown || teardown === this) return
    if (this.closed) {
      // execute straight away if this subscription is closed
      execFinalizer(teardown)
      return
    }
    if (teardown instanceof Subscription) {
      // don't add the same subscription multiple times.
      if (teardown.closed || teardown._hasParent(this)) return
      teardown._addParent(this)
    }
    ;(this._finalizerSet = this._finalizerSet ?? new Set()).add(teardown)
  }

  _addParent(parent: Subscription) {
    ;(this._parentageSet = this._parentageSet ?? new Set()).add(parent)
  }
  _hasParent(parent: Subscription) {
    return this._parentageSet && this._parentageSet.has(parent)
  }
  _removeParent(parent: Subscription) {
    this._parentageSet && this._parentageSet.has(parent)
  }
}
