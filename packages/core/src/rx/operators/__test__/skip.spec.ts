import test from 'ava'
import Sinon from 'sinon'

import { Observable } from '../../Observable'
import { Subject } from '../../Subject'
import { skip } from '../skip'

test('skip should work with Observable', (t) => {
  const observable = new Observable((subscriber) => {
    subscriber.next(1)
    subscriber.next(2)
    subscriber.next(3)
    subscriber.next(4)
  })

  const fn = Sinon.fake()

  observable.pipe(skip(2)).subscribe(fn)

  t.is(fn.callCount, 2)
  t.is(fn.getCall(0).args[0], 3)
  t.is(fn.getCall(1).args[0], 4)
  t.is(fn.getCall(2), null)
})

test('skip should work with Subject', (t) => {
  const subject = new Subject()

  const fn = Sinon.fake()

  subject.pipe(skip(2)).subscribe(fn)
  subject.next(1)
  subject.next(2)
  subject.next(3)
  subject.next(4)

  t.is(fn.callCount, 2)
  t.is(fn.getCall(0).args[0], 3)
  t.is(fn.getCall(1).args[0], 4)
  t.is(fn.getCall(2), null)
})
