import './CommonButtons.css'
import FolderIcon from './FolderIcon'

interface ButtonProps {
    onClick: () => void
}

export const PlayButton = ({ onClick }: ButtonProps) => 
    <div className="play-button" onClick={onClick}></div>

export const FolderButton = ({onClick}: ButtonProps ) =>
    <button onClick={onClick}>
        <FolderIcon />
    </button>
