import test from 'ava'
import sinon from 'sinon'

import { Observable } from '../Observable'
import { Subscription } from '../Subscription'

test('should be constructed with a subscriber function', (t) => {
  const source = new Observable<number>(function (observer) {
    t.true(typeof observer === 'object')
    t.true(typeof observer.next === 'function')
    t.true(typeof observer.error === 'function')
    t.true(typeof observer.complete === 'function')
    t.true(typeof observer.closed === 'boolean')
    observer.next(1)
    observer.complete()
  })

  source.subscribe({
    next: function (x) {
      t.is(x, 1)
    },
  })
})

test('should send errors thrown in the constructor down the error path', (t) => {
  new Observable<number>(() => {
    throw new Error('this should be handled')
  }).subscribe({
    error(err) {
      t.is(err.message, 'this should be handled')
    },
  })
})

test('should handle empty string sync errors', (t) => {
  const badObservable = new Observable(() => {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw ''
  })

  let caught = false
  badObservable.subscribe({
    error: (err) => {
      caught = true
      t.is(err, '')
    },
  })
  t.true(caught)
})

test('should work with handlers with hacked bind methods', (t) => {
  const source = new Observable<string>((subscriber) => {
    subscriber.next('Hi')
    subscriber.complete()
  })
  const results: any[] = []
  const next = function (value: string) {
    results.push(value)
  }
  next.bind = () => {
    /* lol */
  }

  const complete = function () {
    results.push('done')
  }
  complete.bind = () => {
    /* lol */
  }

  source.subscribe({ next, complete })
  t.deepEqual(results, ['Hi', 'done'])
})

test('should be synchronous', (t) => {
  let subscribed = false
  let nexted: string
  let completed: boolean
  const source = new Observable<string>((observer) => {
    subscribed = true
    observer.next('wee')
    t.is(nexted, 'wee')

    observer.complete()
    t.true(completed)
  })

  t.false(subscribed)

  let mutatedByNext = false
  let mutatedByComplete = false

  source.subscribe({
    next: (x) => {
      nexted = x
      mutatedByNext = true
    },
    complete: () => {
      completed = true
      mutatedByComplete = true
    },
  })

  t.true(mutatedByNext)
  t.true(mutatedByComplete)
})

test('should run unsubscription logic when an error is sent asynchronously and subscribe is called with no arguments', (t) => {
  const sandbox = sinon.createSandbox()
  const fakeTimer = sandbox.useFakeTimers()

  let unsubscribeCalled = false
  const source = new Observable<number>((observer) => {
    const id = setInterval(() => {
      observer.error(0)
    }, 1)
    return () => {
      clearInterval(id)
      unsubscribeCalled = true
    }
  })

  source.subscribe({
    error() {
      /* noop: expected error */
    },
  })

  setTimeout(() => {
    t.true(unsubscribeCalled)
  }, 100)

  fakeTimer.tick(110)
  sandbox.restore()
})

test('should return a Subscription that calls the unsubscribe function returned by the subscriber', (t) => {
  let unsubscribeCalled = false

  const source = new Observable<number>(() => {
    return () => {
      unsubscribeCalled = true
    }
  })

  const sub = source.subscribe(() => {
    //noop
  })
  t.true(sub instanceof Subscription)
  t.false(unsubscribeCalled)
  t.true(typeof sub.unsubscribe === 'function')

  sub.unsubscribe()
  t.true(unsubscribeCalled)
})
