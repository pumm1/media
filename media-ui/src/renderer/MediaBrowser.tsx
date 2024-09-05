import React, { useEffect, useState } from 'react'
import { MediaType, QueryReq, QueryResult, UpdateRes, getTags, searchMedia, updateMedias } from './MediaClient'
import Selection from './Selection'
import MetaInfoByUrl from './MetaHandler'
import _ from 'lodash'
import { PlayButton, FolderButton } from './CommonButtons'
import errorGif1 from './angry-panda.gif';
import errorGif2 from './monke-pc.gif'
import errorGif3 from './throw-pc.gif'
import errorGif4 from './pc-trash.gif'
import Toast from './Toast'
import HideableComponent from './Hideable'

import './MediaBrowser.css'

const openVideo = (path: string) => {
    console.log(`Opening video in ${path}`)
}

const openFolder = (path: string) => {
    console.log(`Opening folder in ${path}`)
}

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
                <span key={d.title + t} className='tag'>
                    {t.toUpperCase()}
                </span>)
            }
        </div>
        <div className='docButtons'>
            <PlayButton onClick={() => openVideo(d.path)} />
            <FolderButton onClick={() => openFolder(d.path)}/>
        </div>
    </div>

interface DocsProps {
    docs: QueryResult[]
    setDoc: (d: QueryResult) => void
}

const NoResultsTips = [
    'Check your search terms',
    'Check your selected tags',
    "Try scanning for updates",
    "Bitch about shitty software"
]

const ErrorGifs = [
    errorGif1,
    errorGif2,
    errorGif3,
    errorGif4
]

const randomGif = () =>
    Math.floor(Math.random() * ErrorGifs.length)

const Docs = ({docs, setDoc}:DocsProps) => {
    const [randGif, setRandomGif] = useState(randomGif())

    useEffect(() => {
        setRandomGif(randomGif())
    }, [docs.length])
    
    return(
        <>
            { docs.length > 0 ? docs.map(doc => (
                <DocRow key={doc.title + doc.path} setDoc={setDoc} d={doc}/>
            )) : 
            <div className='noDocs'>
                <h3>No results found {'(>_<)'}</h3>
                You may try the following:
                <ul>
                    {NoResultsTips.map((tip, idx) => <li key={tip + idx}>{tip}</li>)}
                </ul>
                <img src={ErrorGifs[randGif]}/>
            </div>}
        </>
    )
}

const mediaUpdateInfoStr = (i: number, prefix: string) =>
  i > 0 ? `${prefix} titles: ${i}. ` : `No ${prefix} titles`

const updateInfo = (res: UpdateRes) => 
    <>
        <div>{mediaUpdateInfoStr(res.added, 'new')}</div>
        <div>{mediaUpdateInfoStr(res.removed, 'removed')}</div>
    </>

//for testing
//const manyTags = ['superhero', 'action', 'test1', 'test2', 'test3', 'test4', 'test4', 'foo', 'bar', 'baz', 'diu', 'dau', 'genre', 'töttöröö', 'barrakuda', 'shark']

const MediaBrowser = () =>  {
    const [isInitialLoad, setIsInitiaload] = useState(true)
    const [tagOptions, setTagOptions] = useState<string[]>([])
    const [titles, setTitles] = useState<string[]>([])
    const [tags, setTags] = useState<string[]>([])
    const [types, setTypes] = useState<MediaType[]>(['movie'])

    const [docs, setDocs] = useState<QueryResult[]>([])

    const [selectedDoc, setDoc] = useState<QueryResult | undefined>(undefined)

    const [showToast, setShowToast] = useState(false)
    
    const [updateLoading, setUpdateLoading] = useState(false)

    const [mediaUpdateInfo, setMediaUpdateInfo] = useState<UpdateRes | undefined>()

    const q: QueryReq = {
        titles: titles,
        tags: tags,
        types: types
    }

    const updateTagsFn = () => getTags().then(tagsRes => {
        setTagOptions(tagsRes)
        if(isInitialLoad) {
            setTags(tagsRes)
            setIsInitiaload(false)
        }
    })

    useEffect(() => {
        updateTagsFn()
    }, [])

    const updateMediaFn = () => searchMedia(q).then(setDocs)

    const triggerToast = () => {
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        setUpdateLoading(false)
        setMediaUpdateInfo(undefined)
        updateMediaFn()
      }, 3000)
    }

    useEffect(() => {
        const delay = 150; 

        const timeoutId = setTimeout(() => {
            updateMediaFn()
        }, delay)

        return () => clearTimeout(timeoutId)
    }, [JSON.stringify(q)])

    return (
        <div className='main'>
          {showToast && mediaUpdateInfo && <Toast message={updateInfo(mediaUpdateInfo)} durationMs={3000} onClose={() => setShowToast(false)}/>}
          <div className='mediaBrowserContainer'>
              <div className='searchField'>
                  <input
                      placeholder='Search titles...'
                      className='search'
                      type='text' 
                      onChange={e => setTitles(parseTitlesFromStr(e.target.value))}
                  />
              </div>
              <HideableComponent contentName='tags'>
                <div className='searchParamContainer'>
                
                  {tagOptions.map(t => (
                      <span key={t}>
                          <Selection isChecked={tags.includes(t)} option={t} onClick={() => {
                                  if (_.difference(tagOptions, tags).length === 0) {
                                    setTags([t])
                                  } else {
                                    if (tags.includes(t)) {
                                        setTags(tags.filter(tag => tag !== t))
                                    } else {
                                        setTags([t, ...tags])
                                    }
                                  }
                              }} />
                      </span>
                  ))}
                  <div className='toggleTags'>
                    <button onClick={() => {
                        if (tags.length > 0) {
                            setTags([])
                        } else {
                            setTags(tagOptions)
                        }
                    }}>Toggle tags</button>
                  </div>
                </div>
              </HideableComponent>
              
              <div className='docContainer'>
                <Docs docs={docs} setDoc={setDoc}/>
              </div>
              <div>
                <button disabled={updateLoading} onClick={() => 
                    Promise.resolve(setUpdateLoading(true)).then(() => updateMedias().then(setMediaUpdateInfo).finally(() => triggerToast()))
                }>
                  Scan for updates
                </button>
              </div>
            </div>
            <div className='detailedMediaContainer'>
                {selectedDoc && <MetaInfoByUrl doc={selectedDoc} onPlay={() => openVideo(selectedDoc.path)} onOpenFolder={() => openFolder(selectedDoc.path)}/>}
            </div>
        </div>
    )
}

export default MediaBrowser;

