import { interval, multiply, take } from '@boilerplate/web'

console.log('react start')
interval(2000)
  .pipe(take(3))
  .subscribe((res) => {
    console.log('react', multiply(res, res + 1))
  })
