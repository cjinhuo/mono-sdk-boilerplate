import { add, Subject, interval } from '@boilerplate/core'

console.log('web start')
interval(2000).subscribe((res) => {
  console.log('web', res)
})
