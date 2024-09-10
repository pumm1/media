import FolderIcon from './FolderIcon'

import './CommonButtons.css'

interface ButtonProps {
    onClick: () => void
}

export const PlayButton = ({ onClick }: ButtonProps) => 
    <div className="play-button" onClick={onClick}></div>

export const FolderButton = ({onClick}: ButtonProps ) =>
    <button className='commonButton' onClick={onClick}>
        <FolderIcon />
    </button>
