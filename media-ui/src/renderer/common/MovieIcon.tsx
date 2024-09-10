import { MediaType } from '../MediaClient'
import movieImage from './movie.png'
import seriesImage from './series.jpg'
import './MovieIcon.css'

interface MediaIconProps {
    type: MediaType
}

const MediaIcon = ({type} : MediaIconProps) => {
  return (
    <div>
      <img src={type === 'movie' ? movieImage : seriesImage} className="movie-img"/>
    </div>
  )
}

export default MediaIcon