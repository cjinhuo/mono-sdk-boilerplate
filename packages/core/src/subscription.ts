import { Subscription } from './rx/Subscription'
import { Subscriber } from './rx/Subscriber'

const main = new Subscription()

let isCalled = false
const child = new Subscription(() => {
  isCalled = true
  console.log('runnn')
})
main.add(child)
main.unsubscribe()

const subscriber = new Subscriber<{ test: string }>({
  next: (value) => {
    console.log('next', value)
  },
})
subscriber.next({ test: 'test' })
subscriber.next({ test: '11111' })
subscriber.unsubscribe()
subscriber.next({ test: '222' })
