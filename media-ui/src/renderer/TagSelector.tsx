import _ from 'lodash'
import Hideable from './common/Hideable'
import Selection from './common/Selection'

import './TagSelector.css'

interface TagSelectorProps {
    setTags: (tags: string[]) => void
    selectedTags: string[]
    tagOptions: string[]
}

const TagSelector = ({selectedTags, tagOptions, setTags}: TagSelectorProps) => {
    return (
        <Hideable contentName='tags'>
            <div>
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
        </Hideable>
    )
}

export default TagSelector