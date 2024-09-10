import { TypeOption } from "./MediaBrowser"

import './SearchInput.css'

const parseTitlesFromStr = (s: String) =>
    s.split(' ')

interface SearchInoutProps {
    setTitles: (titles: string[]) => void
    handleTagsChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
    typeOptions: TypeOption[]
}

const SearchInput = ({setTitles, handleTagsChange, typeOptions}: SearchInoutProps) => {
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
        </div>
    )
}

export default SearchInput