import './CommonButtons.css'
import FolderIcon from './FolderIcon'
import SettingsIcon from './SettingsIcon'

interface ButtonProps {
    onClick: () => void
}

export const PlayButton = ({ onClick }: ButtonProps) => 
    <div className="play-button" onClick={onClick}></div>

export const FolderButton = ({onClick}: ButtonProps ) =>
    <button className='commonButton' onClick={onClick}>
        <FolderIcon />
    </button>

export const SettingsButton = ({onClick}: ButtonProps ) =>
    <button className='commonButton' onClick={onClick}>
        <SettingsIcon />
    </button>
