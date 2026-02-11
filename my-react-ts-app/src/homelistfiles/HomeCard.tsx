import React from 'react'
import { Link } from 'react-router-dom'
import './HomeList.css'

export type Home = {
  id: number
  title: string
  address: string
  price: number
  rating: number
  image: string
}

interface Props {
  home: Home
}

export default function HomeCard({ home }: Props) {
  return (
    <Link to={`/review/${home.id}`} className="home-card-link" aria-label={`Skriv anmeldelse for ${home.title}`}>
      <div className="home-card">
        <div className="home-content">
          <h3>{home.title}</h3>
          <p className="address">{home.address}</p>
          <p className="price">Leiepris: {home.price.toLocaleString()} kr/mnd</p>
          <p className="rating">Rating: {home.rating}/10</p>
        </div>
        <img src={home.image} alt={home.title} className="home-image" />
      </div>
    </Link>
  )
}
