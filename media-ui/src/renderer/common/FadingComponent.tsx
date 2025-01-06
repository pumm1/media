import React, { useState, useEffect } from "react"
import './FadingComponent.css'

type FadingCompoenntProps = {
  isVisible: boolean // Controls visibility
  duration?: number  // Optional duration for the fade animation
  children: JSX.Element
}

const FadingCompoennt = ({ isVisible, duration = 700, children }: FadingCompoenntProps) => {
  const [shouldRender, setShouldRender] = useState(isVisible); // Controls rendering

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true); // Render immediately when becoming visible
    } else {
      // Wait for the fade-out animation before unmounting
      const timeout = setTimeout(() => setShouldRender(false), duration)
      return () => clearTimeout(timeout); // Cleanup timeout on unmount
    }
  }, [isVisible, duration])

  return (
    shouldRender ? (
      <div className={`fade ${isVisible ? 'fade-in' : 'fade-out'}`}>
        {children}
      </div>
    ) : null
  )
}

export default FadingCompoennt
