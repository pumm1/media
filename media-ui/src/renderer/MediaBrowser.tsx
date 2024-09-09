import React, { useEffect, useState } from 'react'
import { MediaType, QueryReq, QueryResult, Season, UpdateRes, getTags, searchMedia, updateMedias } from './MediaClient'
import Selection from './Selection'
import MetaInfoByUrl from './MetaHandler'
import _ from 'lodash'
import { PlayButton, FolderButton } from './CommonButtons'
import errorGif1 from './angry-panda.gif';
import errorGif2 from './monke-pc.gif'
import errorGif3 from './throw-pc.gif'
import errorGif4 from './pc-trash.gif'
import Toast from './Toast'
import Hideable from './Hideable'
import MediaIcon from './MovieIcon'

import './MediaBrowser.css'

const isElectron = () => {
    // Check if 'process.versions.electron' exists, which is only available in Electron
    return !!window.electronAPI && window.electronAPI.isElectron
}

const openFile = (path: string): void =>{
    if (isElectron()) {
        window.electronAPI.openFile(path)
    }
}

const openVideo = (path?: string) => {
    console.log(`Opening video: ${path}`)
    if (path) {
        openFile(path)
    }
}

const openFolder = (path: string) => {
    console.log(`Opening folder: ${path}`)
    openFile(path)
}

const parseTitlesFromStr = (s: String) =>
    s.split(' ')

interface DocProps {
    d: QueryResult
    setDoc: (d: QueryResult) => void
}

const seasonStr = (seasons: Season[]) => {
    const str = seasons.length > 1 ? 'Seasons' : 'Season'

    return `${seasons.length} ${str}`
}

const DocRow = ({ d, setDoc }: DocProps) =>
    <div className='document' onClick={() => setDoc(d)}>
        <h2>{d.title}</h2>
        <div className='mediaInfo'>
            <MediaIcon type={d.type}/> 
            {d.seasons && <div className='seasonInfo'>{seasonStr(d.seasons)}</div>}
        </div>
        <div className='tagContainer'>
            {
                d.tags.map(t =>
                    <span key={d.title + t} className='tag'>
                        {t.toUpperCase()}
                    </span>)
            }
        </div>
        <div className='docButtons'>
            {d.path && <PlayButton onClick={() => openVideo(d.path)} />}
            <FolderButton onClick={() => openFolder(d.folderPath)} />
        </div>
    </div>

interface DocsProps {
    docs: QueryResult[]
    setDoc: (d: QueryResult) => void
    initialResultsFetched: boolean
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


interface NoResultsProps {
    numOfDocs: number
}
const NoResuls = ({numOfDocs}: NoResultsProps) => {
    const [randGif, setRandomGif] = useState(randomGif())

    useEffect(() => {
        setRandomGif(randomGif())
    }, [numOfDocs])

    return (
        <div className='noDocs'>
            <h3>No results found {'(>_<)'}</h3>
            <Hideable contentName='tips'>
                <>
                You may try the following:
                <ul>
                    {NoResultsTips.map((tip, idx) => <li key={tip + idx}>{tip}</li>)}
                </ul>
                <img src={ErrorGifs[randGif]} />
                </>
            </Hideable>
        </div>
    )
}

const Docs = ({ docs, setDoc, initialResultsFetched }: DocsProps) => {
    return (
        <>
            {docs.length > 0 ? docs.map(doc => (
                <DocRow key={doc.title + doc.path} setDoc={setDoc} d={doc} />
            )) :
                !initialResultsFetched ? <></> : <NoResuls numOfDocs={docs.length}/>
            }
        </>
    )
}

const mediaUpdateInfoStr = (i: number, prefix: string) =>
    i > 0 ? `${prefix} titles: ${i}. ` : `No ${prefix} titles`

const updateInfo = (res: UpdateRes) =>
    <>
        <div>{mediaUpdateInfoStr(res.added, 'new')}</div>
        <div>{mediaUpdateInfoStr(res.updatedSeries, 'updated [series]')}</div>
        <div>{mediaUpdateInfoStr(res.removed, 'removed')}</div>
    </>

//for testing
//const manyTags = ['superhero', 'action', 'test1', 'test2', 'test3', 'test4', 'test4', 'foo', 'bar', 'baz', 'diu', 'dau', 'genre', 'töttöröö', 'barrakuda', 'shark']
const allTypes: MediaType[] = ['movie', 'series']

const MediaBrowser = () => {
    const [initialResultsFetched, setInitialResultsFetched] = useState(false)
    const [tagOptions, setTagOptions] = useState<string[]>([])
    const [titles, setTitles] = useState<string[]>([])
    const [tags, setTags] = useState<string[]>([])
    const [types, setTypes] = useState<MediaType[]>(allTypes)

    const [docs, setDocs] = useState<QueryResult[]>([])

    const [selectedDoc, setDoc] = useState<QueryResult | undefined>(undefined)

    const [showToast, setShowToast] = useState(false)

    const [updateLoading, setUpdateLoading] = useState(false)

    const [mediaUpdateInfo, setMediaUpdateInfo] = useState<UpdateRes | undefined>()

    const q: QueryReq = {
        titles,
        tags,
        types
    }

    const initialQ = (tags: string[]): QueryReq => {
        return {
            titles: [],
            tags,
            types: allTypes
        }
    }

    interface TypeOption {
        values: MediaType[]
        label: string
    }
        
    const typeOptions: TypeOption[] = [
        {
            label: 'All',
            values: ['movie', 'series']
        },
        {
            label: 'Movies',
            values: ['movie']
        },
        {
            label: 'Series',
            values: ['series']
        }
    ]


    const updateMediaFn = (q: QueryReq) => searchMedia(q).then(setDocs)

    const initialResultsFn = () => getTags().then(tagsRes => {
        setTagOptions(tagsRes)
        updateMediaFn(initialQ(tagsRes)).then(() => { 
            setInitialResultsFetched(true)
            setTags(tagsRes)
        })
    })

    useEffect(() => {
        initialResultsFn()
    }, [])

    const triggerToast = () => {
        setShowToast(true);
        setTimeout(() => {
            setShowToast(false);
            setUpdateLoading(false)
            setMediaUpdateInfo(undefined)
            updateMediaFn(q)
        }, 3000)
    }

    useEffect(() => {
        const delay = 400;

        const timeoutId = setTimeout(() => {
            updateMediaFn(q)
        }, delay)

        return () => clearTimeout(timeoutId)
    }, [JSON.stringify(q)])

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValues = Array.from(event.target.selectedOptions, (option) => {
            const selectedLabel = option.label;
            const selectedOption = typeOptions.find(opt => opt.label === selectedLabel);
            return selectedOption ? selectedOption.values : [];
        }).flat();
        setTypes(selectedValues);
    };

    return (
        <div className='main'>
            {showToast && mediaUpdateInfo && <Toast message={updateInfo(mediaUpdateInfo)} durationMs={3000} onClose={() => setShowToast(false)} />}
            <div className='mediaBrowserContainer'>
                <div className='searchField'>
                    <input
                        placeholder='Search titles containing...'
                        className='search'
                        type='text'
                        onChange={e => setTitles(parseTitlesFromStr(e.target.value))}
                    />
                    <select onChange={handleChange}>
                        {typeOptions.map ((opt, idx) => 
                            <option key={opt.label + idx} value={opt.values}>{opt.label}</option>)
                        }
                    </select>
                </div>
                <Hideable contentName='tags'>
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
                </Hideable>

                <div className='docContainer'>
                    <Docs docs={docs} setDoc={setDoc} initialResultsFetched={initialResultsFetched} />
                </div>
                <div className='scanner'>
                    <button disabled={updateLoading} onClick={() =>
                        Promise.resolve(setUpdateLoading(true)).then(() => updateMedias().then(setMediaUpdateInfo).finally(() => triggerToast()))
                    }>
                        Scan for updates
                    </button>
                </div>
            </div>
            <div className='detailedMediaContainer'>
                {selectedDoc && <MetaInfoByUrl doc={selectedDoc} playMedia={path => openVideo(path)} onOpenFolder={() => openFolder(selectedDoc.folderPath)} />}
            </div>
        </div>
    )
}

export default MediaBrowser;

