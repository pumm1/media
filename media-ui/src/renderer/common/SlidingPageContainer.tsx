import './SlidingPageContainer.css'

interface SlidingPageContainerProps {
    children: any
    isOpen: boolean
}

const SlidingPageContainer = ({ children, isOpen }: SlidingPageContainerProps) => 
    <div className={`slidingPageContainer ${isOpen ? 'open' : ''}`}>
        {children}
    </div>

export default SlidingPageContainer