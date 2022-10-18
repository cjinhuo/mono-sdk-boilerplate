import test from 'ava'

import { Observable } from '../Observable'
import { Subscriber } from '../Subscriber'

import { asInteropSubscriber, getRegisteredFinalizers } from './helper'

test('should ignore next messages after unsubscription', (t) => {
  let times = 0

  const sub = new Subscriber({
    next() {
      times += 1
    },
  })

  sub.next()
  sub.next()
  sub.unsubscribe()
  sub.next()
  t.is(times, 2)
})

test('should ignore error messages after unsubscription', (t) => {
  let times = 0
  let errorCalled = false

  const sub = new Subscriber({
    next() {
      times += 1
    },
    error() {
      errorCalled = true
    },
  })

  sub.next()
  sub.next()
  sub.unsubscribe()
  sub.next()
  sub.error()
  t.is(times, 2)
  t.false(errorCalled)
})
test('should ignore complete messages after unsubscription', (t) => {
  let times = 0
  let completeCalled = false

  const sub = new Subscriber({
    next() {
      times += 1
    },
    complete() {
      completeCalled = true
    },
  })

  sub.next()
  sub.next()
  sub.unsubscribe()
  sub.next()
  sub.complete()
  t.is(times, 2)
  t.false(completeCalled)
})

test('should not be closed when other subscriber with same observer instance completes', (t) => {
  const observer = {
    next: function () {
      /*noop*/
    },
  }

  const sub1 = new Subscriber(observer)
  const sub2 = new Subscriber(observer)

  sub2.complete()

  t.false(sub1.closed)
  t.true(sub2.closed)
})

test('should call complete observer without any arguments', (t) => {
  let argument: Array<any> | null = []

  const observer = {
    complete: (...args: Array<any>) => {
      argument = args
    },
  }

  const sub1 = new Subscriber(observer)
  sub1.complete()

  t.is(argument.length, 0)
})

test('should chain interop unsubscriptions', (t) => {
  let observableUnsubscribed = false
  let subscriberUnsubscribed = false
  let subscriptionUnsubscribed = false

  const subscriber = new Subscriber()
  subscriber.add(() => (subscriberUnsubscribed = true))

  const source = new Observable<void>(() => () => (observableUnsubscribed = true))
  const subscription = source.subscribe(asInteropSubscriber(subscriber))
  subscription.add(() => (subscriptionUnsubscribed = true))
  subscriber.unsubscribe()

  t.true(observableUnsubscribed)
  t.true(subscriberUnsubscribed)
  t.true(subscriptionUnsubscribed)
})

test('should have idempotent unsubscription', (t) => {
  let count = 0
  const subscriber = new Subscriber()
  subscriber.add(() => ++count)
  t.is(count, 0)

  subscriber.unsubscribe()
  t.is(count, 1)

  subscriber.unsubscribe()
  t.is(count, 1)
})

test('should close, unsubscribe, and unregister all finalizers after complete', (t) => {
  let isUnsubscribed = false
  const subscriber = new Subscriber()
  subscriber.add(() => (isUnsubscribed = true))
  subscriber.complete()
  t.true(isUnsubscribed)
  t.true(subscriber.closed)
  t.is(getRegisteredFinalizers(subscriber).length, 0)
})

test('should close, unsubscribe, and unregister all finalizers after error', (t) => {
  let isTornDown = false
  const subscriber = new Subscriber({
    error: () => {
      // Mischief managed!
      // Adding this handler here to prevent the call to error from
      // throwing, since it will have an error handler now.
    },
  })
  subscriber.add(() => (isTornDown = true))
  subscriber.error(new Error('test'))
  t.true(isTornDown)
  t.true(subscriber.closed)
  t.is(getRegisteredFinalizers(subscriber).length, 0)
})

// should not leak the destination：unit test
