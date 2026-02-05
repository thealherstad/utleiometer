import React from 'react'

import HomeList from './HomeList'
import type { Home } from './HomeCard'

export default function HomesView() {
  const homes: Home[] = [
    { id: 1, title: 'Koselig leilighet', address: 'Trondheim', price: 12000, rating: 8, image: '' },
    { id: 2, title: 'Stor enebolig', address: 'Oslo', price: 18000, rating: 9, image: '' },
    { id: 3, title: 'Moderne rekkehus', address: 'Bergen', price: 14000, rating: 7, image: '' },
    { id: 4, title: 'Luksus appartement', address: 'Stavanger', price: 16000, rating: 9, image: '' },
    { id: 5, title: 'Rolig villa', address: 'Lillehammer', price: 15000, rating: 8, image: '' },
    { id: 6, title: 'Sentral leilighet', address: 'Drammen', price: 11000, rating: 7, image: '' },
    { id: 7, title: 'Stor familie enebolig', address: 'Moss', price: 16500, rating: 8, image: '' },
    { id: 8, title: 'Moderne loft', address: 'Sandnes', price: 13000, rating: 8, image: '' },
    { id: 9, title: 'Klassisk våningshus', address: 'Kristiansand', price: 14500, rating: 7, image: '' },
    { id: 10, title: 'Minimalistisk leilighet', address: 'Ålesund', price: 11500, rating: 9, image: '' },
    { id: 11, title: 'Charmerende landsted', address: 'Hamar', price: 10500, rating: 8, image: '' },
    { id: 12, title: 'Moderne villa', address: 'Tromsø', price: 13500, rating: 8, image: '' },
  ]

  return (
    <>
      <h1>Boligoversikt</h1>
      <HomeList homes={homes} />
    </>
  )
}