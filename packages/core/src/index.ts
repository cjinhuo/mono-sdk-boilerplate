import { map, Observable, Subject, Subscriber, zip, interval } from 'rxjs'

export * from './rx'
export const add = (a: number, b: number) => a + b

export { interval }

// export function add(a: number, b: number): number {
//   return a + b
// }

// export function sub(a: number, b: number): number {
//   return a - b
// }

// const observable_1 = new Observable((subscriber) => {
//   let count = 0
//   setInterval(() => {
//     count += 2
//     subscriber.next(count)
//   }, 1000)
// })

// const observable_2 = new Observable((subscriber) => {
//   let count = 1
//   setInterval(() => {
//     count += 2
//     subscriber.next(count)
//   }, 5000)
// })
// const sub1 = observable_1.subscribe(function (res) {
//   console.log('sub1', res)
// })

// const sub2 = observable_1.subscribe(function (res) {
//   console.log('sub2', res)
// })
// setTimeout(() => {
//   sub1.unsubscribe()
// }, 3000)

// const subject = new Subject()
// const subject_1 = subject.subscribe((e) => console.log('subject_1', e))
// const subject_2 = subject.subscribe((e) => console.log('subject_2', e))

// subject.next(1)
// setInterval(() => {
//   subject.next(1)
// }, 2000)
// setTimeout(() => {
//   debugger
//   subject.unsubscribe()
// }, 3000)

// zip(observable_1, observable_2)
//   .pipe(map(([one, two]) => ({ one, two })))
//   .subscribe((res) => {
//     console.log('res', res)
//   })
// const subject = new Subject<Number>()
// subject.subscribe((res) => {
//   console.log('res', res)
// })
// subject.next(1)

// const a = new Subscriber<{ test: string }>({
//   next(value) {
//     console.log('next', value)
//   },
//   error(err) {
//     console.log('err', err)
//   },
//   complete() {
//     console.log('complete')
//   },
// })

// a.next({ test: 'test' })

// const b = new Subscriber<{ test: string }>(null)
