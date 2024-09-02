import React, { useEffect, useState } from 'react'
import { MediaType, QueryReq, QueryResult, createSearchParams, searchMedia } from './MediaClient'
import MetaInfoByUrl from './MetaHandler'

import './MediaBrowser.css'
import PlayButton from './PlayButton'

const openVideo = (path: string) => {
    console.log(`Opening video in ${path}`)
}

const testImdb: string = 'https://www.imdb.com/title/tt0078915/'

const parseTitlesFromStr = (s: String) => 
    s.split(' ')

interface DocProps {
  d: QueryResult
  setUrl: (s: string) => void
}

const DocRow = ({d, setUrl}: DocProps) => 
    <div className='document'>
        <h2>{d.title}</h2>
        <div className='tagContainer'>
            {
            d.tags.map(t => 
                <span className='tag'>
                    {t.toUpperCase()}
                </span>)
            }
        </div>
        <div className='docButtons'>
          <PlayButton onClick={() => openVideo(d.path)} />
          <button onClick={() => setUrl(d.imdb)}>Info</button>
        </div>
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

    const [url, setUrl] = useState<string | undefined>(undefined)

    const q: QueryReq = {
        titles: titles,
        tags: tags,
        types: types
    }

    useEffect(() => {
        const delayedFunction = () => searchMedia(q).then(setDocs); //TODO: don't duplicate, but use this now just to see how it looks with more data!

        const delay = 150; 

        const timeoutId = setTimeout(() => {
            delayedFunction();
        }, delay);

        return () => clearTimeout(timeoutId);
    }, [JSON.stringify(q)])

    return (
        <div className='main'>
          <div className='mediaBrowserContainer'>
              <div className='searchField'>
                  <input
                      placeholder='Search'
                      className='search'
                      type='text' 
                      onChange={e => setTitles(parseTitlesFromStr(e.target.value))}
                  />
              </div>
              <div className='searchParamContainer'>
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
              <div className='docContainer'>
                {docs.map(doc => (
                    <DocRow key={doc.title} setUrl={setUrl} d={doc}/>
                ))}
              </div>
            </div>
            <div className='detailedMediaContainer'>
                <MetaInfoByUrl url={url}/>
            </div>
        </div>
    )
}

export default MediaBrowser;

