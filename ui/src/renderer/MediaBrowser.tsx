import React, { useEffect, useState } from 'react'
import { MediaType, QueryReq, QueryResult, createSearchParams, searchMedia } from './MediaClient'
import Selection from './Selection'
import MetaInfoByUrl from './MetaHandler'

import './MediaBrowser.css'
import PlayButton from './PlayButton'

const openVideo = (path: string) => {
    const { shell } = require('electron')
    shell.openPath(path)
}

const testImdb: string = 'https://www.imdb.com/title/tt0078915/'

const parseTitlesFromStr = (s: String) => 
    s.split(' ')

interface DocProps {
  d: QueryResult
  setDoc: (d: QueryResult) => void
}

const DocRow = ({d, setDoc}: DocProps) => 
    <div className='document' onClick={() => setDoc(d)}>
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

    const [selectedDoc, setDoc] = useState<QueryResult | undefined>(undefined)

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
                          <Selection isChecked={tags.includes(t)} option={t} onClick={() => {
                                  if (tags.includes(t)) {
                                      setTags(tags.filter(tag => tag !== t))
                                  } else {
                                      setTags([t, ...tags])
                                  }
                              }} />
                      </span>
                  ))}
                  <button onClick={() => {
                      if (tags.length > 0) {
                          setTags([])
                      } else {
                          setTags(tagOptions)
                      }
                  }}>Toggle tags</button>
              </div>
              <div className='docContainer'>
                {docs.map(doc => (
                    <DocRow key={doc.title} setDoc={setDoc} d={doc}/>
                ))}
              </div>
            </div>
            <div className='detailedMediaContainer'>
                {selectedDoc && <MetaInfoByUrl doc={selectedDoc} onPlay={() => openVideo(selectedDoc.path)}/>}
            </div>
        </div>
    )
}

export default MediaBrowser;

