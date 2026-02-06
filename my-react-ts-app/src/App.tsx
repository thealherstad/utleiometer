import './App.css'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import RegistrationPage from './pages/Registrationpage'
import AddListingPage from './pages/AddListingPage'
import HomesView from './homelistfiles/HomesView'
import { Route, Routes } from 'react-router-dom'

function App() {
  const links = [
    { label: 'Boliger', to: '/boliger' },
    { label: 'Legg inn bolig', to: '/legg-inn-bolig' },
  ]

  return (
    <>
      <NavBar links={links} />
      <main className="page-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/boliger" element={<HomesView />} />
          <Route path="/logg-inn" element={<LoginPage />} />
          <Route path="/registrer" element={<RegistrationPage />} />
          <Route path="/legg-inn-bolig" element={<AddListingPage />} />
        </Routes>
      </main>
    </>
  )
}

export default App
