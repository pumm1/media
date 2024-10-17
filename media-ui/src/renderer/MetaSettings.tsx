import './MetaSettings.css'
import { useEffect, useRef, useState } from 'react'
import {listMetaFiles, MetaFileInfo, metaFileReadyForScanning, MetaUpdateReq, updateMetaFile} from './MediaClient'
import LoadingIndicator from './common/LoadingIndicator'
import MediaIcon from './common/MovieIcon'

const isValidImdbUrl = (url: string) => {
    const urlValid: boolean = url.startsWith('https://www.imdb.com/title/') || url.startsWith('www.imdb.com/title/')

    return urlValid
  }
  

interface MetaInfoProps {
    metaInfo: MetaFileInfo
    updateMetaInfos: () => void
    existingTags: string[]
}

const MetaInfoRow = ({metaInfo, updateMetaInfos, existingTags}: MetaInfoProps) => {
    const [updateLoading, setUpdateLoading] = useState(false)
    const [tags, setTags] = useState(metaInfo.tags)
    const [imdb, setImdb] = useState(metaInfo.imdb)
    const [added, setAdded] = useState(metaInfo.added)
    const [title, setTitle] = useState(metaInfo.title)
    
    const req: MetaUpdateReq = {
        tags,
        imdb,
        added,
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
        updateMetaFile(req).then(() => metaFileReadyForScanning({metaPath: metaInfo.metaPath}).then(() => {
            setUpdateLoading(false)
            updateMetaInfos()
        }))
    }

    const updateTagsFromStr = (tagsStr: string) => setTags(tagsStr.split(',').map(tag => tag.trim()))

    const metaIsValid = tags.length > 0 && isValidImdbUrl(imdb)

    const tagsToSelect = existingTags.filter(t => !tags.includes(t))

    return (
        <div className='metaInfoContainer'>
            <div className='metaInfo'>
                Title
                <div className='metaField'>
                    <input type='text' value={title} onChange={e => setTitle(e.target.value)}/>
                </div>
                Tags
                <div className='metaField'>
                    <input type='text' value={tags.join(',')} onChange={e => updateTagsFromStr(e.target.value)}/>
                    <select onChange={e => setTags(tags.concat(e.target.value))}>
                        {tagsToSelect.map(t => 
                            <option key={t} value={t}>{t}</option>
                        )}
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
                    <button onClick={() => updateFn()}>Update</button>
                    {metaInfo.isPending && <button disabled={!metaIsValid} onClick={() => readyToScanFn()}>Ready to scan</button>}
                </div>
                {updateLoading && <LoadingIndicator />}
            </div>
        </div>
    )
}

interface MetaSettingsProps {
    onClose: () => void
    existingTags: string[]
}

const MetaSettings = ({ onClose, existingTags }: MetaSettingsProps) => {
    const [allMetaFiles, setAllMetaFiles] = useState<MetaFileInfo[]>([])
    const [useOnlyPending, setUseOnlyPending] = useState(true)

    const componentRef = useRef<HTMLDivElement | null>(null)

    const handleClickOutside = (event: MouseEvent) => {
        if (componentRef.current && !componentRef.current.contains(event.target as Node)) {
            onClose()
        }
    }

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const metaFilesByPending = (metaFiles: MetaFileInfo[], onlyPending: boolean): MetaFileInfo[] =>
        onlyPending ? metaFiles.filter(m => m.isPending) : metaFiles

    const [usedMetaFiles, setUsedMetaFiles] = useState<MetaFileInfo[] | undefined>(undefined)

    const updateMetaFiles = () => {
        listMetaFiles().then(metas => {
            setAllMetaFiles(metas)
            setUsedMetaFiles(metaFilesByPending(metas, useOnlyPending)) // Initialize with pending or all based on current toggle
        })
    }

    useEffect(() => {
        // Fetch all meta files when the component mounts
        updateMetaFiles()
    }, [])

    useEffect(() => {
        // Update usedMetaFiles whenever allMetaFiles or useOnlyPending changes
        setUsedMetaFiles(metaFilesByPending(allMetaFiles, useOnlyPending))
    }, [allMetaFiles, useOnlyPending])

    const onToggle = () => {
        setUseOnlyPending(prev => !prev) // This will trigger the useEffect to recalculate usedMetaFiles
    }

    return (
        <div className='metaContainer' ref={componentRef}>
            <h3>Meta data management</h3>
            Only pending: <input type='checkbox' checked={useOnlyPending} onChange={onToggle} />
            {usedMetaFiles === undefined ? 
                <div className='loading'><LoadingIndicator /></div> :
                <div className='metaInfos'>
                    {usedMetaFiles.map(m => <MetaInfoRow key={m.title + m.imdb + m.metaPath} existingTags={existingTags} metaInfo={m} updateMetaInfos={updateMetaFiles}/>)}
                </div>
            }
        </div>
    )
}


export default MetaSettings
