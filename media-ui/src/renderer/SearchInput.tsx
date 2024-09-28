import { TypeOption } from "./MediaBrowser"
import { SortDirection, SortType } from "./MediaClient"

import './SearchInput.css'
import LoadingIndicator from "./common/LoadingIndicator"

const parseTitlesFromStr = (s: String) =>
    s.split(' ')

interface SearchInoutProps {
    isLoading: boolean
    setTitles: (titles: string[]) => void
}

const SearchInput = ({ isLoading, setTitles }: SearchInoutProps) => {
    return (
        <div className='searchField'>
            <input
                placeholder='Search titles containing...'
                className='search'
                type='text'
                onChange={e => setTitles(parseTitlesFromStr(e.target.value))}
            />
            {isLoading && <div className="searchLoading"><LoadingIndicator /> </div>}
        </div>
    )
}

export default SearchInput