import React, { useState, useRef } from "react"
import "./Hideable.css"

interface HideableComponentProps {
    contentName: string
    initiallyVisible?: boolean
    duration?: number
    children: React.ReactNode
}

const Hideable: React.FC<HideableComponentProps> = ({
    initiallyVisible = false,
    duration = 500,
    children,
    contentName,
}) => {
  const [isVisible, setIsVisible] = useState(initiallyVisible);
  const contentRef = useRef<HTMLDivElement | null>(null)

  // Toggle visibility state
  const toggleVisibility = () => {
    setIsVisible((prevState) => !prevState)
  };

  return (
    <div className="hideableContainer">
      <button onClick={toggleVisibility}>
        {isVisible ? "Hide" : "Show"} {contentName}
      </button>

      {/* The wrapper div for the sliding content */}
      <div
        className="slide-container"
        style={{
          maxHeight: isVisible
            ? `${contentRef.current?.scrollHeight || 0}px`
            : "0px",
          transition: `max-height ${duration}ms ease-in-out`,
        }}
      >
        {/* The actual content that is being shown/hidden */}
        <div ref={contentRef} className="content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Hideable;
