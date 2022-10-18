import test from 'ava'
import Sinon from 'sinon'

import { Observable } from '../../Observable'
import { Subject } from '../../Subject'
import { take } from '../take'

// test('take should work with Observable', (t) => {
//   const observable = new Observable((subscriber) => {
//     subscriber.next(1)
//     subscriber.next(2)
//     subscriber.next(3)
//     subscriber.next(4)
//   }).pipe(take(2))

//   const fn = Sinon.fake()

//   observable.subscribe(fn)

//   t.is(fn.callCount, 2)
//   t.is(fn.getCall(0).args[0], 1)
//   t.is(fn.getCall(1).args[0], 2)
// })

test('take should work with Subject', (t) => {
  const subject = new Subject()

  const fn = Sinon.fake()

  debugger
  subject.pipe(take(2)).subscribe(fn)
  subject.next(1)
  subject.next(2)
  subject.next(3)
  subject.next(4)

  t.is(fn.callCount, 2)
  t.is(fn.getCall(0).args[0], 1)
  t.is(fn.getCall(1).args[0], 2)
})
