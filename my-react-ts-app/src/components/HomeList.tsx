import React from 'react'
import HomeCard, { Home } from './HomeCard'

interface Props {
  homes: Home[]
}

export default function HomeList({ homes }: Props) {
  return (
    <div className="home-list">
      {homes.map((h) => (
        <HomeCard key={h.id} home={h} />
      ))}
    </div>
  )
}
