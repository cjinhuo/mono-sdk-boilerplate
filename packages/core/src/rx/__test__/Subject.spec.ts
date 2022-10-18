import test from 'ava'

import { Observable } from '../Observable'
import { Subject } from '../Subject'

test('should allow next with undefined or any when created with no type', (t) => {
  const subject = new Subject()
  subject.subscribe({
    next: (x) => {
      t.is(x, undefined)
    },
  })

  const data: any = undefined
  subject.next(undefined)
  subject.next(data)
  subject.complete()
})

test('should allow empty next when created with void type', (t) => {
  const subject = new Subject<void>()
  subject.subscribe({
    next: (x) => {
      t.is(x, undefined)
    },
  })

  subject.next()
  subject.complete()
})

test('should pump values right on through itself', (t) => {
  const subject = new Subject<string>()
  const expected = ['foo', 'bar']

  subject.subscribe({
    next: (x: string) => {
      t.is(x, expected.shift())
    },
  })

  subject.next('foo')
  subject.next('bar')
  subject.complete()
})

test('should pump values to multiple subscribers', (t) => {
  const subject = new Subject<string>()
  const expected = ['foo', 'bar']

  let i = 0
  let j = 0

  subject.subscribe(function (x) {
    t.is(x, expected[i++])
  })

  subject.subscribe({
    next: function (x) {
      t.is(x, expected[j++])
    },
  })

  t.is(subject.observers.length, 2)

  subject.next('foo')
  subject.next('bar')
  subject.complete()
})

test('should handle subscribers that arrive and leave at different times, ' + 'subject does not complete', (t) => {
  const subject = new Subject<number>()
  const results1: (number | string)[] = []
  const results2: (number | string)[] = []
  const results3: (number | string)[] = []

  subject.next(1)
  subject.next(2)
  subject.next(3)
  subject.next(4)

  const subscription1 = subject.subscribe({
    next: function (x) {
      results1.push(x)
    },
    error: function () {
      results1.push('E')
    },
    complete: () => {
      results1.push('C')
    },
  })

  subject.next(5)

  const subscription2 = subject.subscribe({
    next: function (x) {
      results2.push(x)
    },
    error: function () {
      results2.push('E')
    },
    complete: () => {
      results2.push('C')
    },
  })

  subject.next(6)
  subject.next(7)

  subscription1.unsubscribe()

  subject.next(8)

  subscription2.unsubscribe()

  subject.next(9)
  subject.next(10)

  const subscription3 = subject.subscribe({
    next: function (x) {
      results3.push(x)
    },
    error: function () {
      results3.push('E')
    },
    complete: () => {
      results3.push('C')
    },
  })

  subject.next(11)

  subscription3.unsubscribe()

  t.deepEqual(results1, [5, 6, 7])
  t.deepEqual(results2, [6, 7, 8])
  t.deepEqual(results3, [11])
})

test('should handle subscribers that arrive and leave at different times, ' + 'subject completes', (t) => {
  const subject = new Subject<number>()
  const results1: (number | string)[] = []
  const results2: (number | string)[] = []
  const results3: (number | string)[] = []

  subject.next(1)
  subject.next(2)
  subject.next(3)
  subject.next(4)

  const subscription1 = subject.subscribe({
    next: function (x) {
      results1.push(x)
    },
    error: function () {
      results1.push('E')
    },
    complete: () => {
      results1.push('C')
    },
  })

  subject.next(5)

  const subscription2 = subject.subscribe({
    next: function (x) {
      results2.push(x)
    },
    error: function () {
      results2.push('E')
    },
    complete: () => {
      results2.push('C')
    },
  })

  subject.next(6)
  subject.next(7)

  subscription1.unsubscribe()

  subject.complete()
  subscription2.unsubscribe()

  const subscription3 = subject.subscribe({
    next: function (x) {
      results3.push(x)
    },
    error: function () {
      results3.push('E')
    },
    complete: () => {
      results3.push('C')
    },
  })
  subscription3.unsubscribe()

  t.deepEqual(results1, [5, 6, 7])
  t.deepEqual(results2, [6, 7, 'C'])
  t.deepEqual(results3, ['C'])
})

test(
  'should handle subscribers that arrive and leave at different times, ' + 'subject terminates with an error',
  (t) => {
    const subject = new Subject<number>()
    const results1: (number | string)[] = []
    const results2: (number | string)[] = []
    const results3: (number | string)[] = []

    subject.next(1)
    subject.next(2)
    subject.next(3)
    subject.next(4)

    const subscription1 = subject.subscribe({
      next: function (x) {
        results1.push(x)
      },
      error: function () {
        results1.push('E')
      },
      complete: () => {
        results1.push('C')
      },
    })

    subject.next(5)

    const subscription2 = subject.subscribe({
      next: function (x) {
        results2.push(x)
      },
      error: function () {
        results2.push('E')
      },
      complete: () => {
        results2.push('C')
      },
    })

    subject.next(6)
    subject.next(7)

    subscription1.unsubscribe()

    subject.error(new Error('err'))

    subscription2.unsubscribe()

    const subscription3 = subject.subscribe({
      next: function (x) {
        results3.push(x)
      },
      error: function () {
        results3.push('E')
      },
      complete: () => {
        results3.push('C')
      },
    })

    subscription3.unsubscribe()

    t.deepEqual(results1, [5, 6, 7])
    t.deepEqual(results2, [6, 7, 'E'])
    t.deepEqual(results3, ['E'])
  },
)

test(
  'should handle subscribers that arrive and leave at different times, ' + 'subject completes before nexting any value',
  (t) => {
    const subject = new Subject<number>()
    const results1: (number | string)[] = []
    const results2: (number | string)[] = []
    const results3: (number | string)[] = []

    const subscription1 = subject.subscribe({
      next: function (x) {
        results1.push(x)
      },
      error: function () {
        results1.push('E')
      },
      complete: () => {
        results1.push('C')
      },
    })

    const subscription2 = subject.subscribe({
      next: function (x) {
        results2.push(x)
      },
      error: function () {
        results2.push('E')
      },
      complete: () => {
        results2.push('C')
      },
    })

    subscription1.unsubscribe()

    subject.complete()

    subscription2.unsubscribe()

    const subscription3 = subject.subscribe({
      next: function (x) {
        results3.push(x)
      },
      error: function () {
        results3.push('E')
      },
      complete: () => {
        results3.push('C')
      },
    })

    subscription3.unsubscribe()
    t.deepEqual(results1, [])
    t.deepEqual(results2, ['C'])
    t.deepEqual(results3, ['C'])
  },
)

test('should disallow new subscriber once subject has been disposed', (t) => {
  const subject = new Subject<number>()
  const results1: (number | string)[] = []
  const results2: (number | string)[] = []
  const results3: (number | string)[] = []

  const subscription1 = subject.subscribe({
    next: function (x) {
      results1.push(x)
    },
    error: function () {
      results1.push('E')
    },
    complete: () => {
      results1.push('C')
    },
  })

  subject.next(1)
  subject.next(2)

  const subscription2 = subject.subscribe({
    next: function (x) {
      results2.push(x)
    },
    error: function () {
      results2.push('E')
    },
    complete: () => {
      results2.push('C')
    },
  })

  subject.next(3)
  subject.next(4)
  subject.next(5)

  subscription1.unsubscribe()
  subscription2.unsubscribe()
  subject.unsubscribe()

  t.deepEqual(results1, [1, 2, 3, 4, 5])
  t.deepEqual(results2, [3, 4, 5])
  t.deepEqual(results3, [])
})

test('should not allow values to be nexted after it is unsubscribed', (t) => {
  const subject = new Subject<string>()
  const expected = ['foo']

  subject.subscribe(function (x) {
    t.is(x, expected.shift())
  })

  subject.next('foo')
  subject.unsubscribe()
})

test('should clean out unsubscribed subscribers', (t) => {
  const subject = new Subject()

  const sub1 = subject.subscribe(function () {
    //noop
  })

  const sub2 = subject.subscribe(function () {
    //noop
  })

  t.is(subject.observers.length, 2)

  sub1.unsubscribe()
  t.is(subject.observers.length, 1)

  sub2.unsubscribe()
  t.is(subject.observers.length, 0)
})

test('should expose observed status', (t) => {
  const subject = new Subject()

  t.false(subject.observed)

  const sub1 = subject.subscribe(function () {
    //noop
  })

  t.true(subject.observed)

  const sub2 = subject.subscribe(function () {
    //noop
  })

  t.true(subject.observed)
  sub1.unsubscribe()

  t.true(subject.observed)
  sub2.unsubscribe()
  t.false(subject.observed)
  subject.unsubscribe()
  t.is(subject.observed, null)
})

test('test once subscriber', (t) => {
  const subject = new Subject()

  t.false(subject.observed)

  const sub1 = subject.subscribe(function () {
    sub1.unsubscribe()
  })
  t.true(subject.observed)
  subject.next({})
  t.false(subject.observed)
})

test('should be an Observer which can be given to Observable.subscribe', (t) => {
  const source = new Observable<number>((subscriber) => {
    subscriber.next(1)
    subscriber.next(2)
    subscriber.next(3)
    subscriber.next(4)
    subscriber.next(5)
    subscriber.complete()
  })
  const subject = new Subject<number>()
  const expected = [1, 2, 3, 4, 5]

  subject.subscribe({
    next: function (x) {
      t.is(x, expected.shift())
    },
    error: () => {},
    complete: () => {},
  })

  source.subscribe(subject)
})

test('should not next after completed', (t) => {
  const subject = new Subject<string>()
  const results: string[] = []
  subject.subscribe({ next: (x) => results.push(x), complete: () => results.push('C') })
  subject.next('a')
  subject.complete()
  subject.next('b')
  t.deepEqual(results, ['a', 'C'])
})

test('should not next after error', (t) => {
  const error = new Error('wut?')
  const subject = new Subject<string>()
  const results: string[] = []
  subject.subscribe({ next: (x) => results.push(x), error: (err) => results.push(err) })
  subject.next('a')
  subject.error(error)
  subject.next('b')
  t.deepEqual(results, ['a', error])
})
