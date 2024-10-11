import './MetaSettings.css'
import { useEffect, useRef, useState } from 'react'
import {listMetaFiles, MetaFileInfo, MetaUpdateReq, updateMetaFile} from './MediaClient'
import LoadingIndicator from './common/LoadingIndicator'
import MediaIcon from './common/MovieIcon'

interface MetaInfoProps {
    metaInfo: MetaFileInfo
}
const MetaInfoRow = ({metaInfo}: MetaInfoProps) => {
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

    return (
        <div className='metaInfoContainer'>
            <div className='metaInfo'>
                Title:
                <div className='metaField'>
                    <input type='text' value={title} onChange={e => setTitle(e.target.value)}/>
                </div>
                Tags: 
                <div className='metaField'>
                    <input type='text' value={tags.join(',')} onChange={e => setTags(e.target.value.split(','))}/>
                </div>
                IMDB:
                <div className='metaField'>
                    <input type='text' value={imdb} onChange={e => setImdb(e.target.value)}/>
                </div>
                <div className='metaField'>
                    <MediaIcon type={metaInfo.type} />
                </div>
                <div className='metaField'>
                    {metaInfo.added ? 'Added' : 'Pending'}
                </div>
                <div className='metaField'>
                    <button onClick={() => updateFn()}>Update</button>
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

    const [usedMetaFiles, setUsedMetaFiles] = useState<MetaFileInfo[]>([])

    useEffect(() => {
        // Fetch all meta files when the component mounts
        listMetaFiles().then(metas => {
            setAllMetaFiles(metas)
            setUsedMetaFiles(metaFilesByPending(metas, useOnlyPending)) // Initialize with pending or all based on current toggle
        })
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
            Only pending: <input type='checkbox' checked={useOnlyPending} onChange={onToggle} />
            {usedMetaFiles.length === 0 ? 
                <div className='loading'><LoadingIndicator /></div> :
                <div className='metaInfos'>
                    {usedMetaFiles.map(m => <MetaInfoRow key={m.title + m.imdb + m.metaPath} metaInfo={m} />)}
                </div>
            }
        </div>
    )
}


export default MetaSettings
