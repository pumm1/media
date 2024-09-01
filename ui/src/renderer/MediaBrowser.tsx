import React, { useEffect, useState } from 'react';
import { MediaType, QueryReq, QueryResult, createSearchParams, searchMedia } from '../MediaClient';
import './MediaBrowser.css'

const openVideo = (path: string) => {
    const { shell } = require('electron')
    shell.openPath(path)
}

const parseTitlesFromStr = (s: String) => 
    s.split(' ')

const Doc = (d: QueryResult) => 
    <div>
        <h2>{d.title}</h2>
        <div className='tagContainer'>
            {
            d.tags.map(t => 
                <span className='tag'>
                    {t.toUpperCase()}
                </span>)
            }
        </div>
        <div>Path: {d.path}</div>
        <button onClick={() => openVideo(d.path)}>Watch</button>
    </div>

const tagOptions = [
    'action',
    'horror',
    'thriller',
    'comedy'
]

const MediaBrowser = () =>  {
    const [titles, setTitles] = useState<string[]>([])
    const [tags, setTags] = useState<string[]>(tagOptions)
    const [types, setTypes] = useState<MediaType[]>(['movie'])

    const [docs, setDocs] = useState<QueryResult[]>([])

    const q: QueryReq = {
        titles: titles,
        tags: tags,
        types: types
    }

    useEffect(() => {
        const delayedFunction = () => searchMedia(q).then(setDocs);

        const delay = 150; 

        const timeoutId = setTimeout(() => {
            delayedFunction();
        }, delay);

        return () => clearTimeout(timeoutId);
    }, [JSON.stringify(q)])

    return (
        <div>
            <div className='searchField'>
                <input
                    className='search'
                    type='text' 
                    onChange={e => setTitles(parseTitlesFromStr(e.target.value))}
                />
            </div>
            <div>
                {tagOptions.map(t => (
                    <span key={t}>
                        {t.toUpperCase()}
                        <input 
                            type='checkbox' 
                            checked={tags.includes(t)} 
                            onChange={() => {
                                if (tags.includes(t)) {
                                    setTags(tags.filter(tag => tag !== t))
                                } else {
                                    setTags([t, ...tags])
                                }
                            }}
                        />
                    </span>
                ))}
                <button onClick={() => {
                    if (tags.length > 0) {
                        setTags([])
                    } else {
                        setTags(tagOptions)
                    }
                }}>Toggle all</button>
            </div>
            {docs.map(doc => (
                <Doc key={doc.title} {...doc} />
            ))}
        </div>
    )
}

export default MediaBrowser;

