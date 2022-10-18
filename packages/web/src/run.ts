import { add, Subject, interval } from '@boilerplate/core'

interval(500).subscribe((res) => {
  console.log('web', res)
})
