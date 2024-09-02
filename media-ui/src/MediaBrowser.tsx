import React, { useEffect, useState } from 'react'
import { MediaType, QueryReq, QueryResult, createSearchParams, searchMedia } from './MediaClient'
import './MediaBrowser.css'
import MetaInfoByUrl from './MetaHandler'

const openVideo = (path: string) => {
    console.log(`Opening video in ${path}`)
}

const testImdb: string = 'https://www.imdb.com/title/tt0078915/'

const parseTitlesFromStr = (s: String) => 
    s.split(' ')

const Doc = (d: QueryResult) => 
    <div>
        <h2>{d.title}</h2>
        <div>{d.imdb}</div>
        <div className='tagContainer'>
            {
            d.tags.map(t => 
                <span className='tag'>
                    {t.toUpperCase()}
                </span>)
            }
        </div>
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
        <div className='main'>
          <div className='mediaBrowserContainer'>
          <h1>PatsuWareFlix</h1>
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
              <div>
                {docs.map(doc => (
                    <Doc key={doc.title} {...doc} />
                ))}
              </div>
            </div>
            <div className='detailedMediaContainer'>
                <MetaInfoByUrl url={'https://www.imdb.com/title/tt0100589/'}/>
            </div>
        </div>
    )
}

export default MediaBrowser;

