import './MetaSettings.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import {getTags, listMetaFiles, MetaFileInfo, metaFileReadyForScanning, MetaUpdateReq, resetMedias, updateMetaFile} from './MediaClient'
import LoadingIndicator from './common/LoadingIndicator'
import MediaIcon from './common/MovieIcon'

const imdbRegex = new RegExp('^https:\/\/www.imdb\.com\/title\/([a-zA-Z0-9]+)+\/$')

interface MetaInfoProps {
    metaInfo: MetaFileInfo
    updateMetaInfos: () => void
}

const MetaInfoRow = ({metaInfo, updateMetaInfos}: MetaInfoProps) => {
    const [updateLoading, setUpdateLoading] = useState(false)
    const [tags, setTags] = useState(metaInfo.tags)
    const [imdb, setImdb] = useState(metaInfo.imdb)
    const [title, setTitle] = useState(metaInfo.title)

    const [tagOptions, setTagOptions] = useState<string[]>([])

    useEffect(() => {
        getTags().then(setTagOptions)
    }, [])

    const nonEmptyTags = (t: string[]) => t.filter(t => t !== '')
    
    const req: MetaUpdateReq = {
        tags: nonEmptyTags(tags),
        imdb,
        added: metaInfo.added,
        title,
        type: metaInfo.type,
        metaPath: metaInfo.metaPath
    }

    const updateFn = () => {
        setUpdateLoading(true)
        updateMetaFile(req).then(() => setUpdateLoading(false))
    }

    const readyToScanFn = () => {
        setUpdateLoading(true)
        metaFileReadyForScanning({metaPath: metaInfo.metaPath}).then(() => {
            setUpdateLoading(false)
            updateMetaInfos()
        })
    }

    const updateTags = (tagsStr: string) => setTags(tagsStr.split(',').map(tag => tag.trim()))

    const selectTag = (tagsStr: string) => setTags(nonEmptyTags([...tags, tagsStr]).sort())

    const isReadyToScan: boolean = nonEmptyTags(tags).length > 0 && imdb.length > 0 && imdbRegex.test(imdb)

    const infoHasNotChanged = metaInfo.tags.join(',') === tags.join(',') && metaInfo.imdb === imdb && metaInfo.title === title

    return (
        <div className='metaInfoContainer'>
            <div className='metaInfo'>
                Title
                <div className='metaField'>
                    <input type='text' value={title} onChange={e => setTitle(e.target.value)}/>
                </div>
                Tags
                <div className='metaField'>
                    <input type='text' value={tags.join(',')} onChange={e => updateTags(e.target.value)}/>
                    <select value='' onChange={(e: React.ChangeEvent<HTMLSelectElement>) => selectTag(e.target.value)}>
                        <option value="" disabled>
                            -- SELECT --
                        </option>
                        {tagOptions.filter((t) => !tags.includes(t)).map((tagOpt, idx) => (
                            <option key={tagOpt + idx} value={tagOpt}>
                                {tagOpt.toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>
                IMDB
                <div className='metaField'>
                    <input type='text' value={imdb} onChange={e => setImdb(e.target.value)}/>
                </div>
                <div className='metaField'>
                    <MediaIcon type={metaInfo.type} />
                </div>
                <div className='metaField'>
                    <b>{metaInfo.added ? 'Added' : 'Pending'}</b>
                </div>
                <div className='metaField'>
                    <button disabled={infoHasNotChanged} onClick={() => updateFn()}>Update</button>
                    {metaInfo.isPending && <button disabled={!isReadyToScan} onClick={() => readyToScanFn()}>Ready to scan</button>}
                </div>
                {updateLoading && <LoadingIndicator />}
            </div>
        </div>
    )
}

interface MetaSettingsProps {
    onClose: () => void
}

const MetaSettings = ({onClose}: MetaSettingsProps) => {
    const [allMetaFiles, setAllMetaFiles] = useState<MetaFileInfo[]>([])
    const [useOnlyPending, setUseOnlyPending] = useState(true)

    const componentRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {

        const handleClickOutside = (event: MouseEvent) => {
            if (componentRef.current && !componentRef.current.contains(event.target as Node)) {
                onClose()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [onClose])

    const metaFilesByPending = (metaFiles: MetaFileInfo[], onlyPending: boolean): MetaFileInfo[] =>
        onlyPending ? metaFiles.filter(m => m.isPending) : metaFiles

    const [usedMetaFiles, setUsedMetaFiles] = useState<MetaFileInfo[] | undefined>(undefined)

    const updateMetaFiles = useCallback(() => {
        listMetaFiles().then(metas => {
            setAllMetaFiles(metas)
            setUsedMetaFiles(metaFilesByPending(metas, useOnlyPending)) // Initialize with pending or all based on current toggle
        })
    }, [useOnlyPending]) // Dependencies for useCallback

    useEffect(() => {
        // Fetch all meta files when the component mounts
        updateMetaFiles()
    }, [updateMetaFiles]) // Dependency array includes the memoized updateMetaFiles


    useEffect(() => {
        // Update usedMetaFiles whenever allMetaFiles or useOnlyPending changes
        setUsedMetaFiles(metaFilesByPending(allMetaFiles, useOnlyPending))
    }, [allMetaFiles, useOnlyPending])

    const onToggle = () => {
        setUseOnlyPending(prev => !prev) // This will trigger the useEffect to recalculate usedMetaFiles
    }

    const [showReset, setShowReset] = useState(false)

    return (
        <div className='metaContainer' ref={componentRef}>
            <h3>Meta data management</h3>
            <div className='scanAll'>
                <button onClick={() => setShowReset(!showReset)}>{showReset ? 'Cancel' : 'Reset everything' }</button>
                {showReset && <p>This action deletes everything from the DB (Doesn't delete any actual media from the hard drive)</p>}
                {showReset && <button onClick={() => resetMedias()}>Confirm reset</button>}
            </div>
            <div>
                Show only pending: <input type='checkbox' checked={useOnlyPending} onChange={onToggle} />
                {usedMetaFiles === undefined ? 
                    <div className='loading'><LoadingIndicator /></div> :
                    <div className='metaInfos'>
                        {usedMetaFiles.map(m => <MetaInfoRow key={m.title + m.imdb + m.metaPath} metaInfo={m} updateMetaInfos={updateMetaFiles}/>)}
                    </div>
                }
            </div>
        </div>
    )
}


export default MetaSettings
