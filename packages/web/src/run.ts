import { add, interval, take } from '@boilerplate/core'

console.log('web start')
interval(2000)
  .pipe(take(3))
  .subscribe((res) => {
    console.log('web', res)
  })
