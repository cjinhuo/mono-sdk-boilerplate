import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import { reactAdd } from '@mono/react'
function App() {
  const [count, setCount] = useState(0)

  return (
    <div className='App'>
      <div>
        <a href='https://vitejs.dev' target='_blank'>
          <img src='/vite.svg' className='logo' alt='Vite logo' />
        </a>
        <a href='https://reactjs.org' target='_blank'>
          <img src={reactLogo} className='logo react' alt='React logo' />
        </a>
      </div>
      <div className='card'>
        <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
      </div>
      <div>reactAdd from @mono/react,以下展示 1 + 2 = reactAdd(1, 2)</div>
      <div>1 + 2 = {reactAdd(1, 2)}</div>
    </div>
  )
}

export default App
