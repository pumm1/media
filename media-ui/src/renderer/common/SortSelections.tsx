import alphabeticalIcon from './alphabetical.svg'
import calendarIcon from './calendar.svg'

import './SortSelections.css'

interface SelectionProps {
    isSelected: boolean
    onClick: () => void
}

export const AlphabeticalSelection = ({ isSelected, onClick }: SelectionProps) => 
    <div className={isSelected ? 'selected' : 'notSelected'} onClick={onClick}>
        <img src={alphabeticalIcon} width={37} height={37}/>
    </div>

export const CreatedSelection = ({ isSelected, onClick }: SelectionProps) => 
    <div className={isSelected ? 'selected' : 'notSelected'} onClick={onClick}>
        <img src={calendarIcon} width={37} height={37}/>
    </div>
