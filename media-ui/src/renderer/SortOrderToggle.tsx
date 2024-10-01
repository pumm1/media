import React, { useState } from "react"
import SortOrderIcon from "./common/SortOrderIcon"

import './SortOrderToggle.css'

interface SortOrderToggleProps {
    onClick: () => void
}

const SortOrderToggle = ({ onClick }: SortOrderToggleProps) => {
  // State to track toggle
  const [isToggled, setIsToggled] = useState(false);

  // Toggle handler
  const handleToggle = () => {
    setIsToggled(!isToggled)
    onClick()
  }

  return (
    <div onClick={handleToggle}>
      <SortOrderIcon className={`icon ${!isToggled ? 'rotated' : ''}`}/>
    </div>
  )
}

export default SortOrderToggle
