import { Subscription } from './src/rx/Subscription'

const main = new Subscription()

let isCalled = false
const child = new Subscription(() => {
  isCalled = true
  console.log('runnn')
})
main.add(child)
main.unsubscribe()
