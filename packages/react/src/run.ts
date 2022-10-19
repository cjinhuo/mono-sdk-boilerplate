import { interval, multiply } from '@boilerplate/web'

console.log('react start')
interval(2000).subscribe((res) => {
  console.log('react', multiply(res, res + 1))
})
