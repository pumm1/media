import _ from 'lodash'
import Hideable from './common/Hideable'
import Selection from './common/Selection'

import './SearchOptions.css'
import { SortDirection, SortType } from './MediaClient'
import { TypeOption } from './MediaBrowser'

interface SeachOptionsProps {
    setTags: (tags: string[]) => void
    selectedTags: string[]
    tagOptions: string[]
    handleTypesChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
    typeOptions: TypeOption[]
    setSortType: (s: SortType) => void
    sortOptions: SortType[]
    setSortDirection: (s: SortDirection) => void
    directionOptions: SortDirection[]
}

const SearchOptions = ({selectedTags, tagOptions, setTags, sortOptions, setSortDirection, directionOptions, setSortType, handleTypesChange, typeOptions}: SeachOptionsProps) => {
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
                <div>
                    <select onChange={handleTypesChange}>
                        {typeOptions.map ((opt, idx) => 
                            <option key={opt.label + idx} value={opt.values}>{opt.label}</option>)
                        }
                    </select>
                    <select onChange={e => {
                        const value = e.target.value
                        if(value === 'title' || value === 'created') {
                            setSortType(value)
                        }
                    }}>
                        {sortOptions.map ((opt, idx) => 
                            <option key={opt+ idx} value={opt}>Sort by: {opt}</option>)
                        }
                    </select>
                    <select onChange={e => {
                        const value = e.target.value
                        if(value === 'default' || value === 'reverse') {
                            setSortDirection(value)
                        }
                    }}>
                        {directionOptions.map ((opt, idx) => 
                            <option key={opt+ idx} value={opt}>Direction: {opt}</option>)
                        }
                    </select>
                </div>
            </div>
        </Hideable>
    )
}

export default SearchOptions