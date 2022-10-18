import { skip, Subject, take } from './rx'

const subject = new Subject()
const subject_1 = subject.pipe(skip(1),take(1))
const subscription = subject_1.subscribe((e) => console.log('subject_1', e))
subject.next(1)
subject.next(2)
subscription.unsubscribe()
