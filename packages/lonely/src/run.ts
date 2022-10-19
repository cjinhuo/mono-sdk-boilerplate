import { interval, take } from 'rxjs'

console.log('lonely start')
interval(2000)
  .pipe(take(1))
  .subscribe((res) => {
    console.log('lonely', res)
  })
