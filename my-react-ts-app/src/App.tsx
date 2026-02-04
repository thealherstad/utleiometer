import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import HomeList from './components/HomeList'

function App() {
  const [count, setCount] = useState(0)

  const homes = [
    { id: 1, title: 'Koselig leilighet', address: 'Trondheim', price: 2500000, image: 'https://via.placeholder.com/400x240?text=Leilighet' },
    { id: 2, title: 'Stor enebolig', address: 'Oslo', price: 5500000, image: 'https://via.placeholder.com/400x240?text=Enebolig' },
    { id: 3, title: 'Moderne rekkehus', address: 'Bergen', price: 3500000, image: 'https://via.placeholder.com/400x240?text=Rekkehus' },
  ]

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <HomeList homes={homes} />
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
