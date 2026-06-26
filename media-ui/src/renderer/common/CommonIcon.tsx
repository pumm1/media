import awardImage from './award.jpg'
import metaCriticImage from './metacritic.svg'
import imdbImage from './imdb.svg'
import rottenTomatoesImg from './rotten_tomatoes.png'
import './CommonIcon.css'

export const AwardIcon = () => {
  return (
    <div>
      <img src={awardImage} width={25} height={25} alt="Award icon" className="icon-img"/>
    </div>
  )
}

export const ImdbIcon = () => {
    return (
      <div>
        <img src={imdbImage} width={25} height={25} alt="IMDb icon" className="icon-img"/>
      </div>
    )
}
  
export const MetaCiritcIcon = () => {
    return (
      <div>
        <img src={metaCriticImage} width={25} height={25} alt="Metacritic icon" className="icon-img"/>
      </div>
    )
}

export const RottenTomatoesIcon = () => {
    return (
      <div>
        <img src={rottenTomatoesImg} width={25} height={25} alt="Rotten tomatoes icon" className="icon-img"/>
      </div>
    )
}
