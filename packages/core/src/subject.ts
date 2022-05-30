import { Subject } from './rx/Subject'

const subject = new Subject()
debugger
const subject_1 = subject.subscribe((e) => console.log('subject_1', e))
const subject_2 = subject.subscribe((e) => console.log('subject_2', e))

subject.next(1)
setInterval(() => {
  subject.next(1)
}, 2000)
setTimeout(() => {
  subject.unsubscribe()
}, 3000)
