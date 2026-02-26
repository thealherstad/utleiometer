import { useEffect, useState } from 'react'

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
        
        
        const convertedHomes: Home[] = listings.map((listing) => ({
          id: listing.id,
          title: listing.area, 
          address: `${listing.address}${listing.city ? ', ' + listing.city : ''}`, 
          price: 12000, 
          rating: 8, 
          image: listing.imageUrl || '', 
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
    <section className="homes-page">
      <header className="homes-header">
        <h1>Boligoversikt</h1>
        <p>Utforsk boliger og trykk pa et kort for detaljer eller anmeldelse.</p>
      </header>

      {loading && <p className="homes-status">Laster boligene...</p>}
      {error && <p className="homes-status homes-status-error">Feil: {error}</p>}
      {!loading && homes.length === 0 && (
        <p className="homes-status">Ingen boliger funnet. Legg inn en bolig for a komme i gang.</p>
      )}
      {!loading && homes.length > 0 && <HomeList homes={homes} />}
    </section>
  )
}
