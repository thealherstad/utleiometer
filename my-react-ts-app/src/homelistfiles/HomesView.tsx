import { useEffect, useMemo, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'

import { db } from '../firebase'
import HomeList from './HomeList'
import type { Home } from './HomeCard'
import { getAllListings } from '../services/listingService'
import Layout from '../components/Layout'

type ReviewRecord = {
  housingId?: string
  placementScore?: number
  priceScore?: number
  costScore?: number
  overallScore?: number
}

function calculateAverageReviewScore(review: ReviewRecord) {
  const scores = [
    review.placementScore,
    review.priceScore,
    review.costScore,
    review.overallScore,
  ].filter((score): score is number => typeof score === 'number' && score > 0)

  if (scores.length === 0) {
    return 0
  }

  const total = scores.reduce((sum, score) => sum + score, 0)
  return total / scores.length
}

export default function HomesView() {
  const [homes, setHomes] = useState<Home[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState('alle')
  const [minimumRating, setMinimumRating] = useState('0')
  const [maximumPrice, setMaximumPrice] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState('relevance')

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true)

        const [listings, reviewsSnapshot] = await Promise.all([
          getAllListings(),
          getDocs(collection(db, 'reviews')),
        ])

        const ratingAccumulator = new Map<string, { total: number; count: number }>()

        reviewsSnapshot.forEach((docItem) => {
          const data = docItem.data() as ReviewRecord
          const housingId = data.housingId

          if (!housingId) {
            return
          }

          const averageScore = calculateAverageReviewScore(data)

          if (averageScore === 0) {
            return
          }

          const current = ratingAccumulator.get(housingId) ?? { total: 0, count: 0 }
          ratingAccumulator.set(housingId, {
            total: current.total + averageScore,
            count: current.count + 1,
          })
        })

        const convertedHomes: Home[] = listings.map((listing) => {
          const ratingData = ratingAccumulator.get(listing.id)
          const averageRating = ratingData ? ratingData.total / ratingData.count : 0

          return {
            id: listing.id,
            title: listing.city || 'Ukjent område',
            address: listing.address,
            price: listing.price ?? 0,
            rating: Number(averageRating.toFixed(1)),
            image: listing.imageUrl || '',
          }
        })

        setHomes(convertedHomes)
        setError(null)
      } catch (err) {
        console.error('Feil ved henting av boligene:', err)
        setError('Kunne ikke hente boligene fra databasen')
        setHomes([])
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [])

  const maxAvailablePrice = useMemo(() => {
    if (homes.length === 0) {
      return 20000
    }

    return Math.max(...homes.map((home) => home.price))
  }, [homes])

  useEffect(() => {
    setMaximumPrice((previousMaximumPrice) => {
      if (previousMaximumPrice === null) {
        return maxAvailablePrice
      }

      return Math.min(previousMaximumPrice, maxAvailablePrice)
    })
  }, [maxAvailablePrice])

  const placeOptions = useMemo(
    () => Array.from(new Set(homes.map((home) => home.title))).sort((a, b) => a.localeCompare(b)),
    [homes],
  )

  const effectiveMaximumPrice = maximumPrice ?? maxAvailablePrice

  const filteredHomes = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase()
    const minRatingValue = Number(minimumRating)

    const result = homes.filter((home) => {
      const matchesSearch =
        normalizedSearchTerm.length === 0 ||
        home.address.toLowerCase().includes(normalizedSearchTerm) ||
        home.title.toLowerCase().includes(normalizedSearchTerm)

      const matchesPlace = selectedPlace === 'alle' || home.title === selectedPlace
      const matchesRating = home.rating >= minRatingValue
      const matchesPrice = home.price <= effectiveMaximumPrice

      return matchesSearch && matchesPlace && matchesRating && matchesPrice
    })

    const sortedHomes = [...result]

    if (sortBy === 'price-asc') {
      sortedHomes.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-desc') {
      sortedHomes.sort((a, b) => b.price - a.price)
    } else if (sortBy === 'rating-desc') {
      sortedHomes.sort((a, b) => b.rating - a.rating)
    } else if (sortBy === 'place') {
      sortedHomes.sort((a, b) => a.title.localeCompare(b.title))
    }

    return sortedHomes
  }, [effectiveMaximumPrice, homes, minimumRating, searchTerm, selectedPlace, sortBy])

  const activeFilterCount = useMemo(() => {
    let count = 0

    if (selectedPlace !== 'alle') count += 1
    if (minimumRating !== '0') count += 1
    if (effectiveMaximumPrice < maxAvailablePrice) count += 1
    if (sortBy !== 'relevance') count += 1

    return count
  }, [effectiveMaximumPrice, maxAvailablePrice, minimumRating, selectedPlace, sortBy])

  function resetFilters() {
    setSelectedPlace('alle')
    setMinimumRating('0')
    setMaximumPrice(maxAvailablePrice)
    setSortBy('relevance')
  }

  return (
    <Layout>
    <section className="homes-page">
      <header className="homes-header">
        <h1>Boligoversikt</h1>
        <div className="homes-header-row">
          <p>Utforsk boliger og filtrer etter sted, rating og pris.</p>
        </div>
      </header>

      <section className="homes-toolbar" aria-label="Søk og filtrering">
        <div className="homes-filter-group homes-filter-group-search">
          <label htmlFor="housing-search">Søk</label>
          <input
            id="housing-search"
            type="text"
            className="homes-search"
            placeholder="Søk etter adresse eller sted"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <button
          type="button"
          className="homes-filter-button"
          onClick={() => setIsFilterOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isFilterOpen}
        >
          Filtrering
          {activeFilterCount > 0 && <span className="homes-filter-badge">{activeFilterCount}</span>}
        </button>
      </section>

      {!loading && !error && (
        <p className="homes-results">
          Viser {filteredHomes.length} av {homes.length} boliger
        </p>
      )}

      {loading && <p className="homes-status">Laster boligene...</p>}
      {error && <p className="homes-status homes-status-error">Feil: {error}</p>}
      {!loading && homes.length === 0 && (
        <p className="homes-status">Ingen boliger funnet. Legg inn en bolig for a komme i gang.</p>
      )}
      {!loading && homes.length > 0 && filteredHomes.length === 0 && (
        <p className="homes-status">Ingen boliger matcher filtrene dine.</p>
      )}
      {!loading && filteredHomes.length > 0 && <HomeList homes={filteredHomes} />}

      {isFilterOpen && (
        <div className="homes-modal-backdrop" onClick={() => setIsFilterOpen(false)}>
          <section
            className="homes-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Filtrer boliger"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="homes-modal-header">
              <h2>Filtrer boliger</h2>
              <button
                type="button"
                className="homes-modal-close"
                onClick={() => setIsFilterOpen(false)}
                aria-label="Lukk filtrering"
              >
                Lukk
              </button>
            </div>

            <div className="homes-filters">
              <div className="homes-filter-group">
                <label htmlFor="housing-place">Sted</label>
                <select
                  id="housing-place"
                  className="homes-select"
                  value={selectedPlace}
                  onChange={(event) => setSelectedPlace(event.target.value)}
                >
                  <option value="alle">Alle steder</option>
                  {placeOptions.map((place) => (
                    <option key={place} value={place}>
                      {place}
                    </option>
                  ))}
                </select>
              </div>

              <div className="homes-filter-group">
                <label htmlFor="housing-rating">Min rating</label>
                <select
                  id="housing-rating"
                  className="homes-select"
                  value={minimumRating}
                  onChange={(event) => setMinimumRating(event.target.value)}
                >
                  <option value="0">Alle</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5</option>
                </select>
              </div>

              <div className="homes-filter-group homes-filter-group-wide">
                <label htmlFor="housing-price">
                  Maks pris: {effectiveMaximumPrice.toLocaleString()} kr
                </label>
                <input
                  id="housing-price"
                  type="range"
                  className="homes-range"
                  min="8000"
                  max={String(maxAvailablePrice)}
                  step="250"
                  value={effectiveMaximumPrice}
                  onChange={(event) => setMaximumPrice(Number(event.target.value))}
                />
              </div>

              <div className="homes-filter-group">
                <label htmlFor="housing-sort">Sorter</label>
                <select
                  id="housing-sort"
                  className="homes-select"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                >
                  <option value="relevance">Standard</option>
                  <option value="price-asc">Pris lavest forst</option>
                  <option value="price-desc">Pris hoyest forst</option>
                  <option value="rating-desc">Best rating</option>
                  <option value="place">Sted A-A</option>
                </select>
              </div>
            </div>

            <div className="homes-modal-actions">
              <button type="button" className="homes-modal-secondary" onClick={resetFilters}>
                Nullstill
              </button>
              <button type="button" className="homes-modal-primary" onClick={() => setIsFilterOpen(false)}>
                Vis resultater
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
    </Layout>
  )
}
