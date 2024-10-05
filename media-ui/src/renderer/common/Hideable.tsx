import React, { useState, useRef } from "react"
import "./Hideable.css"

interface HideableComponentProps {
    contentName: string
    initiallyVisible?: boolean
    children: React.ReactNode
}

const Hideable: React.FC<HideableComponentProps> = ({
    initiallyVisible = false,
    children,
    contentName,
}) => {
  const [isVisible, setIsVisible] = useState(initiallyVisible)

  const toggleVisibility = () => {
    setIsVisible((prevState) => !prevState)
  };

  return (
    <div className="hideableContainer">
      <button onClick={toggleVisibility}>
        {isVisible ? "Hide" : "Show"} {contentName}
      </button>
      <div className={`slide-container ${isVisible ? "open" : ""}`}>
        <div className="content">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Hideable
