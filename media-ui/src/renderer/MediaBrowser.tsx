import React, { useEffect, useState } from 'react'
import { MediaType, QueryReq, QueryResult, Season, SortDirection, SortType, UpdateRes, getTags, searchMedia, updateMedias } from './MediaClient'
import MetaInfoByUrl from './MetaHandler'
import _ from 'lodash'
import Toast from './common/Toast'
import SearchInput from './SearchInput'
import TagSelector from './TagSelector'
import Documents from './Documents'

import './MediaBrowser.css'
import LoadingIndicator from './common/LoadingIndicator'

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
    const [sort, setSort] = useState<SortType>('title')
    const [sortDirection, setSortDirection] = useState<SortDirection>('default')
    const [searchLoading, setSearchLoading] = useState(false)

    const [docs, setDocs] = useState<QueryResult[]>([])

    const [selectedDoc, setDoc] = useState<QueryResult | undefined>(undefined)

    const [showToast, setShowToast] = useState(false)

    const [updateLoading, setUpdateLoading] = useState(false)

    const [mediaUpdateInfo, setMediaUpdateInfo] = useState<UpdateRes | undefined>()

    const q: QueryReq = {
        titles,
        tags,
        types,
        sort,
        sortDirection
    }

    console.log(`... q: ${JSON.stringify(q)}`)

    const initialQ = (tags: string[]): QueryReq => {
        return {
            titles: [],
            tags,
            types: allTypes,
            sort: 'title',
            sortDirection: 'default'
        }
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


    const updateMediaFn = (q: QueryReq) => {
        setSearchLoading(true)

        return searchMedia(q).then(setDocs).then(() => setSearchLoading(false))
    }

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

    const handleTagsChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValues = Array.from(event.target.selectedOptions, (option) => {
            const selectedLabel = option.label;
            const selectedOption = typeOptions.find(opt => opt.label === selectedLabel)
            
            return selectedOption ? selectedOption.values : []
        }).flat();
        setTypes(selectedValues)
    }

    const sortOptions: SortType[] = ['title', 'created']
    const directionOptions: SortDirection[] = ['default', 'reverse']
    
    const blurByAmount = (amount: number) =>{
            const filter = {
                filter: `blur(${amount}px)`, 
                transition: 'filter 0.5s ease'
            }

            return filter
        }

    return (
        <div className='main'>
            {selectedDoc && <div className='detailedMediaContainer'>
                <MetaInfoByUrl doc={selectedDoc} playMedia={path => openVideo(path)} onOpenFolder={() => openFolder(selectedDoc.folderPath)} onClose={() => setDoc(undefined)}/>
            </div>}
            {showToast && mediaUpdateInfo && <Toast message={updateInfo(mediaUpdateInfo)} durationMs={3000} onClose={() => setShowToast(false)} />}
            <div className='mediaBrowserContainer' style={selectedDoc ? blurByAmount(2) : blurByAmount(0)}>
                <SearchInput isLoading={searchLoading} setTitles={setTitles} typeOptions={typeOptions} handleTagsChange={handleTagsChange} sortOptions={sortOptions} setSortType={setSort} directionOptions={directionOptions} setSortDirection={setSortDirection}/>
                <TagSelector setTags={setTags} selectedTags={tags} tagOptions={tagOptions}/>
                <Documents docs={docs} setDoc={setDoc} initialResultsFetched={initialResultsFetched} openFolder={openFolder} openVideo={openFile}/>
                <div className='scanner'>
                    <button disabled={updateLoading} onClick={() =>
                        Promise.resolve(setUpdateLoading(true)).then(() => updateMedias().then(setMediaUpdateInfo).finally(() => triggerToast()))
                    }>
                        Scan for updates
                    </button>
                </div>
            </div>
        </div>
    )
}

export default MediaBrowser;

