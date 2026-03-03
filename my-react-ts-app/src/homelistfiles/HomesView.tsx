import { useEffect, useState } from 'react'

import HomeList from './HomeList'
import type { Home } from './HomeCard'
import { getAllListings } from '../services/listingService'

export default function HomesView() {
  const [homes, setHomes] = useState<Home[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

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

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const filteredHomes = homes.filter((home) =>
    home.address.toLowerCase().includes(normalizedSearchTerm)
  )

  return (
    <section className="homes-page">
      <header className="homes-header">
        <h1>Boligoversikt</h1>
        <div className="homes-header-row">
          <p>Utforsk boliger og trykk pa et kort for detaljer eller anmeldelse.</p>
          <input
            type="text"
            className="homes-search"
            placeholder="Søk etter adresse"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Søk etter adresse"
          />
        </div>
      </header>

      {loading && <p className="homes-status">Laster boligene...</p>}
      {error && <p className="homes-status homes-status-error">Feil: {error}</p>}
      {!loading && homes.length === 0 && (
        <p className="homes-status">Ingen boliger funnet. Legg inn en bolig for a komme i gang.</p>
      )}
      {!loading && homes.length > 0 && filteredHomes.length === 0 && (
        <p className="homes-status">Ingen boliger matcher adressen du søkte etter.</p>
      )}
      {!loading && filteredHomes.length > 0 && <HomeList homes={filteredHomes} />}
    </section>
  )
}
