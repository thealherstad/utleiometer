import './App.css'
import NavBar from './components/NavBar'
import Home from './pages/Home'

function App() {
  const links = [
    { label: 'Boliger', to: '/properties' },
    { label: 'Om', to: '/about' },
  ]

  return (
    <>
      <NavBar links={links} />
      <Home />
    </>
  )
}

export default App
