import { interval, take } from 'rxjs'

console.log('core start')
interval(2000)
  .pipe(take(2))
  .subscribe((res) => {
    console.log('core', res)
  })
