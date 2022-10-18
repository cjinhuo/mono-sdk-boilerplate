/* eslint-disable @typescript-eslint/naming-convention */
import { SubscriptionLike, TeardownLogic, UnSubscribable } from './types'
import { arrRemove, isFunction } from './utils'

const execFinalizer = (finalizer: UnSubscribable | (() => void)) => {
  if (isFunction(finalizer)) {
    finalizer()
  } else {
    finalizer?.unsubscribe()
  }
}

export const isSubscription = (value: any): value is Subscription => {
  return (
    value instanceof Subscription ||
    (value && 'closed' in value && isFunction(value.remove) && isFunction(value.add) && isFunction(value.unsubscribe))
  )
}

export class Subscription implements SubscriptionLike {
  /**
   * A flag to indicate whether this Subscription has already been unsubscribed.
   */
  closed = false

  private _parentage: Subscription[] | null = null

  // may be waste a tiny of memory，but set initial value can effectively reduce the following code judgment statements
  private _finalizers: Exclude<TeardownLogic, void>[] | null = null

  constructor(private readonly initialTeardown?: () => void) {}

  unsubscribe(): void {
    if (!this.closed) {
      this.closed = true
      const { _parentage, _finalizers, initialTeardown } = this
      if (_parentage) {
        this._parentage = null
        _parentage.forEach((parent) => parent.remove(this))
      }

      if (isFunction(initialTeardown)) {
        initialTeardown()
      }

      if (_finalizers) {
        this._finalizers = null
        _finalizers.forEach(execFinalizer)
      }
    }
  }

  remove(teardown: Exclude<TeardownLogic, void>): void {
    this._finalizers && arrRemove(this._finalizers, teardown)

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
    const { _finalizers } = this
    this._finalizers = _finalizers ? (_finalizers.push(teardown), _finalizers) : [teardown]
  }

  _addParent(parent: Subscription) {
    const { _parentage } = this
    this._parentage = _parentage ? (_parentage.push(parent), _parentage) : [parent]
  }
  _hasParent(parent: Subscription) {
    return this._parentage && ~this._parentage.indexOf(parent)
  }
  _removeParent(parent: Subscription) {
    this._parentage && arrRemove(this._parentage, parent)
  }
}
