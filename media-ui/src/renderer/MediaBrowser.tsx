import React, { MutableRefObject, useEffect, useRef, useState } from 'react'
import { MediaType, QueryReq, QueryResult, Season, SortDirection, SortType, UpdateRes, getTags, searchMedia, updateMedias } from './MediaClient'
import MetaInfoByUrl from './MetaHandler'
import _ from 'lodash'
import Toast from './common/Toast'
import SearchInput from './SearchInput'
import SearchOptions from './SearchOptions'
import Documents from './Documents'
import LoadingIndicator from './common/LoadingIndicator'

import './MediaBrowser.css'
import PopUpContainer from './common/PopUpContainer'
import { SettingsButton } from './common/CommonButtons'
import MetaSettings from './MetaSettings'
import SlidingPageContainer from './common/SlidingPageContainer'

const isElectron = () => {
    // Check if 'process.versions.electron' exists, which is only available in Electron
    return !!window.electronAPI && window.electronAPI.isElectron
}

const openFile = (path: string): void => {
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

const mediaUpdateInfoStr = (i: number, prefix: string) =>
    i > 0 ? `${prefix} titles: ${i}. ` : `No ${prefix} titles`

const updateInfo = (res: UpdateRes) =>
    <>
        <div>{mediaUpdateInfoStr(res.added, 'new')}</div>
        <div>{mediaUpdateInfoStr(res.updatedSeries, 'updated [series]')}</div>
        <div>{mediaUpdateInfoStr(res.removed, 'removed')}</div>
        <div>{mediaUpdateInfoStr(res.pendingConfig, 'pending configuration')}</div>
    </>

//for testing
//const manyTags = ['superhero', 'action', 'test1', 'test2', 'test3', 'test4', 'test4', 'foo', 'bar', 'baz', 'diu', 'dau', 'genre', 'töttöröö', 'barrakuda', 'shark']
const allTypes: MediaType[] = ['movie', 'series']


export interface TypeOption {
    values: MediaType[]
    label: string
}

const MediaBrowser = () => {
    const [initialResultsFetched, setInitialResultsFetched] = useState(false)
    const [tagOptions, setTagOptions] = useState<string[]>([])
    const [titles, setTitles] = useState<string[]>([])
    const [tags, setTags] = useState<string[]>([])
    const [types, setTypes] = useState<MediaType[]>(allTypes)
    const [sort, setSort] = useState<SortType>('created')
    const [sortDirection, setSortDirection] = useState<SortDirection>('default')
    const [searchLoading, setSearchLoading] = useState(false)

    const [docs, setDocs] = useState<QueryResult[]>([])

    const [selectedDoc, setDoc] = useState<QueryResult | undefined>(undefined)
    const [showSlidingPage, setShowSlidingPage] = useState(false)

    const [showToast, setShowToast] = useState(false)

    const [updateLoading, setUpdateLoading] = useState(false)

    const [mediaUpdateInfo, setMediaUpdateInfo] = useState<UpdateRes | undefined>()

    const [sinceWeeksAgo, setSinceWeeksAgo] = useState(1)

    const [settingsOpen, setSettingsOpen] = useState(false)

    const [page, setPage] = useState(0)
    const pageSize = 15

    const q: QueryReq = {
        titles,
        tags,
        types,
        sort,
        sortDirection,
        page,
        pageSize
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

    const [nextPage, setNextPage] = useState<number | null>(null)

    const tryToFetchMoreDataFn = () => {
        console.log(`maybe fetching more data`)
        if (nextPage) {
            setPage(nextPage)
        }
    }


    const updateMediaFn = (q: QueryReq) => {
        setSearchLoading(true)

        return searchMedia(q).then(queryRes => {
            setNextPage(queryRes.nextPage)
            if (page == 0) {
                setDocs(queryRes.results)
            } else {
                setDocs([...docs, ...queryRes.results])
            }
            setSearchLoading(false)
        })
    }

    const initialResultsFn = () => getTags().then(tagsRes => {
        setTagOptions(tagsRes)
        updateMediaFn(q).then(() => { 
            setInitialResultsFetched(true)
            setTags(tagsRes)
        })
    })

    useEffect(() => {
        initialResultsFn()
    }, [])

    const restartSearch = () => {
        if (page === 0) {
            initialResultsFn()
        } else {
            setPage(0)
        }
    }

    const triggerToastAndUpdateMedias = () => {
        setShowToast(true)
        Promise.resolve(setDocs([])).then(() => restartSearch()).then(() => setTimeout(() => {
            setShowToast(false)
            setUpdateLoading(false)
            setMediaUpdateInfo(undefined)
        }, 3000))
    }

    useEffect(() => {
        const delay = 500

        const timeoutId = setTimeout(() => {
            updateMediaFn(q)
        }, delay)

        return () => clearTimeout(timeoutId)
    }, [JSON.stringify(q)])

    const handleTypesChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValues = Array.from(event.target.selectedOptions, (option) => {
            const selectedLabel = option.label
            const selectedOption = typeOptions.find(opt => opt.label === selectedLabel)
            
            return selectedOption ? selectedOption.values : []
        }).flat()
        setTypes(selectedValues)
        setPage(0)
    }
    
    const blurByAmount = (amount: number) =>{
            const filter = {
                filter: `blur(${amount}px)`, 
                transition: 'filter 0.5s ease'
            }

            return filter
        }

    const updateMediasFn = () => {
        setUpdateLoading(true)
        updateMedias().then(setMediaUpdateInfo).then(() => getTags().then(setTagOptions)).finally(() => {
            setUpdateLoading(false)
            triggerToastAndUpdateMedias()
        })
    }

    const slingPageShown = selectedDoc !== undefined && showSlidingPage

    const useBlur = settingsOpen || slingPageShown

    const inputRef: MutableRefObject<HTMLInputElement | null> = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
        // Keep the input focused after results come in
        if (inputRef.current) {
            inputRef.current.focus()
        }
    }, [docs])  // Depend on docs or the state that triggers search result changes

    const updateDoc = (d: QueryResult) => {
        setDoc(d)
        setShowSlidingPage(true)
    }

    const updateTitles = (t: string[]) => {
        setTitles(t)
        setPage(0)
    }

    const updateTags = (t: string[]) => {
        setTags(t)
        setPage(0)
    }

    const updateSortType = (s: SortType) => {
        setSort(s)
        setPage(0)
    }

    const updateSortDirection = (s: SortDirection) => {
        setSortDirection(s)
        setPage(0)
    }

    return (//the popupsettings becomes the sliding page
        <div className='main'>
            { settingsOpen &&
                <PopUpContainer>
                    <MetaSettings onClose={() => setSettingsOpen(false)}/>
                </PopUpContainer>
            }
            <SlidingPageContainer isOpen={showSlidingPage}>
                {
                    selectedDoc ? 
                        <MetaInfoByUrl setDoc={updateDoc} updateMediasFn={updateMediasFn} doc={selectedDoc} playMedia={path => openVideo(path)} onOpenFolder={() => openFolder(selectedDoc.folderPath)} onClose={() => setShowSlidingPage(false)}/>
                    : <></>
                }
            </SlidingPageContainer>
            {showToast && mediaUpdateInfo && <Toast message={updateInfo(mediaUpdateInfo)} durationMs={3000} onClose={() => setShowToast(false)} />}
            <div className='mediaBrowserContainer' style={useBlur ? blurByAmount(2) : blurByAmount(0)}>
                <SearchInput reference={inputRef} isLoading={searchLoading} setTitles={updateTitles}/>
                <SearchOptions setTags={updateTags}  currentSortDirection={sortDirection} sinceWeeksAgo={sinceWeeksAgo} setNewSinceWeeksAgo={setSinceWeeksAgo} typeOptions={typeOptions} handleTypesChange={handleTypesChange} setSortType={updateSortType} usedSort={sort} setSortDirection={updateSortDirection} selectedTags={tags} tagOptions={tagOptions}/>
                <Documents tryToFetchMoreDataFn={tryToFetchMoreDataFn} sinceWeeksAgo={sinceWeeksAgo} docs={docs} setDoc={updateDoc} initialResultsFetched={initialResultsFetched} />
                <div className='scanner'>
                    <button disabled={updateLoading} onClick={() =>
                        updateMediasFn()
                    }>
                        Scan for updates
                    </button>
                    <SettingsButton onClick={() => setSettingsOpen(true)}/>
                </div>
            </div>
        </div>
    )
}

export default MediaBrowser

