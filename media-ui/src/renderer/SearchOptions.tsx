import _, { sortBy } from 'lodash'
import Hideable from './common/Hideable'
import Selection from './common/Selection'
import { SortDirection, SortType } from './MediaClient'
import { TypeOption } from './MediaBrowser'

import './SearchOptions.css'
import SortOrderIcon from './common/SortOrderIcon'
import SortOrderToggle from './SortOrderToggle'
import {AlphabeticalSelection, CreatedSelection} from './common/SortSelections'

interface SeachOptionsProps {
    setTags: (tags: string[]) => void
    selectedTags: string[]
    tagOptions: string[]
    handleTypesChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
    typeOptions: TypeOption[]
    usedSort: SortType
    setSortType: (s: SortType) => void
    sortOptions: SortType[]
    setSortDirection: (s: SortDirection) => void
    currentSortDirection: SortDirection
    sinceWeeksAgo: number
    setNewSinceWeeksAgo: (s: number) => void
}

const SearchOptions = ({selectedTags, tagOptions, setTags, sortOptions, setSortDirection, usedSort, currentSortDirection, setSortType, handleTypesChange, typeOptions, setNewSinceWeeksAgo, sinceWeeksAgo}: SeachOptionsProps) => {
    return (
        <Hideable contentName='options'>
            <div className='optionsContainer'>
                <div className='tags'>
                    {tagOptions.map(t => (
                        <span key={t}>
                            <Selection isChecked={selectedTags.includes(t)} option={t} onClick={() => {
                                if (_.difference(tagOptions, selectedTags).length === 0) {
                                    setTags([t])
                                } else {
                                    if (selectedTags.includes(t)) {
                                        setTags(selectedTags.filter(tag => tag !== t))
                                    } else {
                                        setTags([t, ...selectedTags])
                                    }
                                }
                            }} />
                        </span>
                    ))}
                    <div className='toggleTags'>
                        <button onClick={() => {
                            if (selectedTags.length > 1) {
                                if (selectedTags.length < tagOptions.length) {
                                    setTags(tagOptions)
                                } else {
                                    setTags([])
                                }
                            } else {
                                setTags(tagOptions)
                            }
                        }}>Toggle tags</button>
                    </div>
                </div>
                <div className='filters'>
                    <select onChange={handleTypesChange}>
                        {typeOptions.map ((opt, idx) => 
                            <option key={opt.label + idx} value={opt.values}>{opt.label}</option>)
                        }
                    </select>
                    <AlphabeticalSelection isSelected={usedSort === 'title'} onClick={() => setSortType('title')}/>
                    <CreatedSelection isSelected={usedSort === 'created'} onClick={() => setSortType('created')}/>
                    <SortOrderToggle onClick={() => {
                        if (currentSortDirection === 'default') { 
                            setSortDirection('reverse') 
                        } else setSortDirection('default')
                    }} />
                </div>
                <div className='newSince'>
                    Indicate new since
                    <input className='range' type="range" step={1} min={0} max={8} value={sinceWeeksAgo} onChange={e => {
                        const value = Number(e.target.value)
                        setNewSinceWeeksAgo(value)
                    }}/>
                    {sinceWeeksAgo} Week(s) ago
                </div>
            </div>
        </Hideable>
    )
}

export default SearchOptions