import { interval } from 'rxjs'

console.log('lonely start')
interval(2000).subscribe((res) => {
  console.log('lonely', res)
})
