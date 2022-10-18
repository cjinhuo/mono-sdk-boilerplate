import test from 'ava'

import { Subscription } from '../Subscription'

test('should unsubscribe child subscriptions', (t) => {
  const main = new Subscription()

  let isCalled = false
  const child = new Subscription(() => {
    isCalled = true
  })
  main.add(child)
  main.unsubscribe()
  t.true(isCalled)
})

test('should unsubscribe child subscriptions if it has already been unsubscribed', (t) => {
  const main = new Subscription()
  main.unsubscribe()

  let isCalled = false
  const child = new Subscription(() => {
    isCalled = true
  })
  main.add(child)
  t.true(isCalled)
})
test('should unsubscribe a finalizer function that was passed', (t) => {
  let isCalled = false
  const main = new Subscription()
  main.add(() => {
    isCalled = true
  })
  main.unsubscribe()
  t.true(isCalled)
})

test('should unsubscribe a finalizer function that was passed immediately if it has been unsubscribed', (t) => {
  let isCalled = false
  const main = new Subscription()
  main.unsubscribe()
  // don't support UnSubscribable
  main.add(() => {
    isCalled = true
  })
  t.true(isCalled)
})

// test('should unsubscribe an Unsubscribable when unsubscribed', (t) => {
//   let isCalled = false
//   const main = new Subscription()
//   // don't support UnSubscribable
//   main.add({
//     unsubscribe() {
//       isCalled = true
//     },
//   })
//   main.unsubscribe()
//   t.true(isCalled)
// })

// remove
test('should remove added Subscriptions', (t) => {
  let isCalled = false
  const main = new Subscription()
  const child = new Subscription(() => {
    isCalled = true
  })
  main.add(child)
  main.remove(child)
  main.unsubscribe()
  t.false(isCalled)
})

test('should remove added functions', (t) => {
  let isCalled = false
  const main = new Subscription()
  const finalizer = () => {
    isCalled = true
  }
  main.add(finalizer)
  main.remove(finalizer)
  main.unsubscribe()
  t.false(isCalled)
})

// test('should unsubscribe from all subscriptions, when some of them throw', (done) => {
//   const finalizers: number[] = []

//   const source1 = new Observable(() => {
//     return () => {
//       finalizers.push(1)
//     }
//   })

//   const source2 = new Observable(() => {
//     return () => {
//       finalizers.push(2)
//       throw new Error('oops, I am a bad unsubscribe!')
//     }
//   })

//   const source3 = new Observable(() => {
//     return () => {
//       finalizers.push(3)
//     }
//   })

//   const subscription = merge(source1, source2, source3).subscribe()

//   setTimeout(() => {
//     expect(() => {
//       subscription.unsubscribe()
//     }).to.throw(UnsubscriptionError)
//     expect(finalizers).to.deep.equal([1, 2, 3])
//     done()
//   })
// })

test('should have idempotent unsubscription', (t) => {
  let count = 0
  const subscription = new Subscription(() => ++count)
  t.is(count, 0)

  subscription.unsubscribe()
  t.is(count, 1)

  subscription.unsubscribe()
  t.is(count, 1)
})

test('should unsubscribe from all parents', (t) => {
  // https://github.com/ReactiveX/rxjs/issues/6351
  const a = new Subscription(() => {
    /* noop */
  })
  const b = new Subscription(() => {
    /* noop */
  })
  const c = new Subscription(() => {
    /* noop */
  })
  const d = new Subscription(() => {
    /* noop */
  })
  a.add(d)
  b.add(d)
  c.add(d)
  // When d is added to the subscriptions, it's added as a finalizer. The
  // length is 1 because the finalizers passed to the ctors are stored in a
  // separate property.
  t.is((a as any)._finalizers.length, 1)
  t.is((b as any)._finalizers.length, 1)
  t.is((c as any)._finalizers.length, 1)
  d.unsubscribe()
  // When d is unsubscribed, it should remove itself from each of its
  // parents.
  t.is((a as any)._finalizers.length, 0)
  t.is((b as any)._finalizers.length, 0)
  t.is((c as any)._finalizers.length, 0)
})
