import { useCallback, useEffect, useRef } from 'react'
import './SlidingPageContainer.css'

type SliderSideVariant = 'left' | 'right'
type SliderSizeVariant = 'big' | 'small'

interface SlidingPageContainerProps {
    children: any
    isOpen: boolean
    side: SliderSideVariant
    size: SliderSizeVariant
    onClose: () => void
}

const SlidingPageContainer = ({ children, isOpen, side, size, onClose }: SlidingPageContainerProps) => {
    const componentRef = useRef<HTMLDivElement | null>(null)

    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (componentRef.current && !componentRef.current.contains(event.target as Node)) {
            onClose()
        }
    }, [onClose]) // Dependencies for useCallback

    const handleEscape = useCallback((event: KeyboardEvent) => {
        if (componentRef.current && !componentRef.current.contains(event.target as Node) && event.key === 'Escape') {
            onClose()
        }
    }, [onClose]) // Dependencies for useCallback


    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [handleClickOutside])

    const className = [
        'slidingPageContainer',
        `slidingPageContainer--${side}`,
        `slidingPageContainer--${size}`,
        isOpen && 'slidingPageContainer--open',
    ]
        .filter(Boolean)
        .join(' ')

    return(
        <div ref={componentRef} className={className}>
            {isOpen ? children : <></>}
        </div>
    )
}

export default SlidingPageContainer