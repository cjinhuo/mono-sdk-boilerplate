import { useState } from 'react'

import { coreAdd } from '@mono/core'

export default function TestCore() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <button id='test-core-button' onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </button>
      {count} + {count} = <span id='test-core-result'>{coreAdd(count, count)}</span>
    </div>
  )
}
