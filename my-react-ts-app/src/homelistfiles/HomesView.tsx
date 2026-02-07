import React, { useEffect, useState } from 'react'

import HomeList from './HomeList'
import type { Home } from './HomeCard'
import { getAllListings } from '../services/listingService'

export default function HomesView() {
  const [homes, setHomes] = useState<Home[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true)
        const listings = await getAllListings()
        
        // Konverter Firestore-data til Home-type
        const convertedHomes: Home[] = listings.map((listing, index) => ({
          id: index + 1, // Bruk index som ID
          title: listing.area, // Bruk "area" som tittel (f.eks. "Trondheim")
          address: `${listing.address}${listing.city ? ', ' + listing.city : ''}`, // Kombinert adresse
          price: 12000, // Standard pris for nå
          rating: 8, // Standard rating for nå
          image: '', // Tom bildeURL
        }))
        
        console.log("Konverterte homes:", convertedHomes)
        setHomes(convertedHomes)
        setError(null)
      } catch (err) {
        console.error("Feil ved henting av boligene:", err)
        setError("Kunne ikke hente boligene fra databasen")
        setHomes([])
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [])

  return (
    <>
      <h1>Boligoversikt</h1>
      {loading && <p>Laster boligene...</p>}
      {error && <p style={{ color: 'red' }}>Feil: {error}</p>}
      {!loading && homes.length === 0 && <p>Ingen boligene funnet. Legg inn en bolig først!</p>}
      {!loading && homes.length > 0 && <HomeList homes={homes} />}
    </>
  )
}