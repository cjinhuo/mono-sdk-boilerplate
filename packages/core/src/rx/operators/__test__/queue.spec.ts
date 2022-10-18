import test from 'ava'
import { Observable } from 'rx/src/Observable'
import Sinon from 'sinon'

import { Subject } from '../../Subject'
import { filter } from '../filter'

test('queue should work with Observable', (t) => {
  const observable = new Observable<number>((subscriber) => {
    subscriber.next(1)
    subscriber.next(2)
    subscriber.next(3)
    subscriber.next(4)
  })

  const fn = Sinon.fake()

  observable.pipe(filter((v) => v !== 2)).subscribe(fn)

  t.is(fn.callCount, 3)
  t.is(fn.getCall(0).args[0], 1)
  t.is(fn.getCall(1).args[0], 3)
  t.is(fn.getCall(2).args[0], 4)
})

test('queue should work with Subject', (t) => {
  const subject = new Subject<number>()

  const fn = Sinon.fake()

  subject.pipe(filter((v) => v !== 2)).subscribe(fn)
  subject.next(1)
  subject.next(2)
  subject.next(3)
  subject.next(4)

  t.is(fn.callCount, 3)
  t.is(fn.getCall(0).args[0], 1)
  t.is(fn.getCall(1).args[0], 3)
  t.is(fn.getCall(2).args[0], 4)
})

test('filter should work with the second param', (t) => {
  const subject = new Subject<number>()

  const fn = Sinon.fake()

  subject.pipe(filter((_, i) => i !== 1)).subscribe(fn)
  subject.next(1)
  subject.next(2)
  subject.next(3)
  subject.next(4)

  t.is(fn.callCount, 3)
  t.is(fn.getCall(0).args[0], 1)
  t.is(fn.getCall(1).args[0], 3)
  t.is(fn.getCall(2).args[0], 4)
})
