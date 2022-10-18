import { interval } from 'rxjs'

interval(1000).subscribe((res) => {
  console.log('core', res)
})
