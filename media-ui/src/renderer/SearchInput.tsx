import { MutableRefObject } from "react"

import './SearchInput.css'
import LoadingIndicator from "./common/LoadingIndicator"

const parseTitlesFromStr = (s: String) =>
    s.split(' ')

interface SearchInoutProps {
    isLoading: boolean
    setTitles: (titles: string[]) => void
    reference: MutableRefObject<HTMLInputElement | null>
}

const SearchInput = ({ reference, isLoading, setTitles }: SearchInoutProps) => {
    return (
        <div className='searchField'>
            <input
                placeholder='Search titles containing...'
                className='search'
                type='text'
                onChange={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    setTitles(parseTitlesFromStr(e.target.value))
                }
                    
                }
                autoFocus
                tabIndex={0}
                ref={reference}
            />
            {isLoading && <div className="searchLoading"><LoadingIndicator /> </div>}
        </div>
    )
}

export default SearchInput