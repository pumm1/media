import _ from 'lodash'
import Hideable from './common/Hideable'
import Selection from './common/Selection'
import { SortDirection, SortType } from './MediaClient'
import { TypeOption } from './MediaBrowser'
import SortOrderToggle from './SortOrderToggle'
import {AlphabeticalSelection, CreatedSelection} from './common/SortSelections'
import { useState } from 'react'

import './SearchOptions.css'

interface SeachOptionsProps {
    setTags: (tags: string[]) => void
    selectedTags: string[]
    tagOptions: string[]
    handleTypesChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
    typeOptions: TypeOption[]
    usedSort: SortType
    setSortType: (s: SortType) => void
    setSortDirection: (s: SortDirection) => void
    currentSortDirection: SortDirection
    sinceWeeksAgo: number
    setNewSinceWeeksAgo: (s: number) => void
}

const crlIsPressed = (event: MouseEvent): boolean => event.ctrlKey || event.metaKey

const SearchOptions = ({selectedTags, tagOptions, setTags, setSortDirection, usedSort, currentSortDirection, setSortType, handleTypesChange, typeOptions, setNewSinceWeeksAgo, sinceWeeksAgo}: SeachOptionsProps) => {
    return (
        <Hideable contentName='filters'>
            <div className='optionsContainer'>
                <div className='tags'>
                    {tagOptions.map(t => (
                        <span key={t}>
                            <Selection isChecked={selectedTags.includes(t)} option={t} onClick={(option, event) => {
                                event.preventDefault()
                                const nativeEvent = event.nativeEvent as MouseEvent // Access the native event

                                if (crlIsPressed(nativeEvent)) {
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
                    <CreatedSelection isSelected={usedSort === 'created'} onClick={() => setSortType('created')}/>
                    <AlphabeticalSelection isSelected={usedSort === 'title'} onClick={() => setSortType('title')}/>
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