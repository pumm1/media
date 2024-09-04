import './PlayButton.css'; // Import your CSS

interface PlayButtonProps {
    onClick: () => void
}

const PlayButton = ({ onClick }: PlayButtonProps) => 
    <div className="play-button" onClick={onClick}></div>

export default PlayButton
