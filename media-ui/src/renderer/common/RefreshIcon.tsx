import refreshImage from './refresh.png';
import './RefreshIcon.css'

const RefreshIcon = () => {
  return (
    <div className='refresh'>
      <img src={refreshImage} width={25} height={25} alt="Refresh Icon"/>
    </div>
  )
}

export default RefreshIcon