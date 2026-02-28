import HomeCard from './HomeCard';
import type { Home } from './HomeCard';

interface Props {
  homes: Home[]
}

function HomeList({ homes }: Props) {
  return (
    <div className="home-list-container">
      <div className="home-list">
        {homes.map((h) => (
          <HomeCard key={h.id} home={h} />
        ))}
      </div>
    </div>
  )
}

export default HomeList
