import { Subscription } from './Subscription'

export interface UnSubscribable {
  unsubscribe(): void
}

// @tiny UnSubscribable | void
export type TeardownLogic = Subscription | (() => void)

export interface SubscriptionLike extends UnSubscribable {
  readonly closed: boolean
}
