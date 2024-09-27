import { TypeOption } from "./MediaBrowser"
import { SortDirection, SortType } from "./MediaClient"

import './SearchInput.css'
import LoadingIndicator from "./common/LoadingIndicator"

const parseTitlesFromStr = (s: String) =>
    s.split(' ')

interface SearchInoutProps {
    isLoading: boolean
    setTitles: (titles: string[]) => void
    handleTagsChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
    setSortType: (s: SortType) => void
    sortOptions: SortType[]
    setSortDirection: (s: SortDirection) => void
    directionOptions: SortDirection[]
    typeOptions: TypeOption[]
}

const SearchInput = ({isLoading, setTitles, handleTagsChange, typeOptions, setSortType, sortOptions, setSortDirection, directionOptions}: SearchInoutProps) => {
    return (
        <div className='searchField'>
            <input
                placeholder='Search titles containing...'
                className='search'
                type='text'
                onChange={e => setTitles(parseTitlesFromStr(e.target.value))}
            />
            <select onChange={handleTagsChange}>
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
                    <option key={opt+ idx} value={opt}>{opt}</option>)
                }
            </select>
            <select onChange={e => {
                const value = e.target.value
                if(value === 'default' || value === 'reverse') {
                    setSortDirection(value)
                }
            }}>
                {directionOptions.map ((opt, idx) => 
                    <option key={opt+ idx} value={opt}>{opt}</option>)
                }
            </select>
            
            
            {isLoading && <div className="searchLoading"><LoadingIndicator /> </div>}
        </div>
    )
}

export default SearchInput