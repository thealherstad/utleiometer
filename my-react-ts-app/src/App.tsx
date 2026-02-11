import './App.css'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import LoginPage from './pages/LoginPage'
import RegistrationPage from './pages/Registrationpage'
import AddListingPage from './pages/AddListingPage'
import ReviewPage from './pages/ReviewPage'
import HomesView from './homelistfiles/HomesView'
import { Route, Routes } from 'react-router-dom'
import ProfilePage from "./pages/ProfilePage";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth } from "./firebase";
import { Navigate } from "react-router-dom";



function App() {
  const links = [
    { label: 'Boliger', to: '/boliger' },
    { label: 'Legg inn bolig', to: '/legg-inn-bolig' },
  ]
  const [user, setUser] = useState<User | null>(null);

  const adminEmails = [
    "admin1@utleiometer.no",
    "admin2@utleiometer.no",
    "admin3@utleiometer.no",
    "admin4@utleiometer.no",
    "admin5@utleiometer.no",
  ];
 const isAdmin = !!user && adminEmails.includes(user.email ?? "");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); 
    });
    return () => unsubscribe(); 
  }, []);

type ProtectedRouteProps = {
  user: User | null;
  children: React.ReactNode;
};

function ProtectedRoute({ user, children }: ProtectedRouteProps) {
  if (!user) return <Navigate to="/logg-inn" replace />;
  return <>{children}</>; 
}

  return (
    <>
      <NavBar links={links} user={user} isAdmin={isAdmin} />
      <main className="page-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/boliger" element={<HomesView />} />
          <Route path="/logg-inn" element={user ? <ProfilePage /> : <LoginPage />} />
          <Route path="/registrer" element={<RegistrationPage />} />
          <Route path="/legg-inn-bolig" element={<AddListingPage />} />
          <Route path="/review/:id" element={<ReviewPage />} />
          <Route
  path="/profil"
  element={
    <ProtectedRoute user={user}>
      <ProfilePage />
    </ProtectedRoute>
  }
/>
        </Routes>
      </main>
    </>
  )
}

export default App
