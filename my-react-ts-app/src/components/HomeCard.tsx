import React from 'react'
import './HomeList.css'

export type Home = {
  id: number
  title: string
  address: string
  price: number
  image?: string
}

interface Props {
  home: Home
}

export default function HomeCard({ home }: Props) {
  return (
    <div className="home-card">
      <img src={home.image ?? 'https://via.placeholder.com/400x240?text=Home'} alt={home.title} />
      <div className="home-info">
        <h3>{home.title}</h3>
        <p className="address">{home.address}</p>
        <p className="price">{home.price.toLocaleString()} kr</p>
      </div>
    </div>
  )
}
