import { QueryResult, Season } from "./MediaClient"
import { FolderButton, PlayButton } from "./common/CommonButtons"
import errorGif1 from './angry-panda.gif';
import errorGif2 from './monke-pc.gif'
import errorGif3 from './throw-pc.gif'
import errorGif4 from './pc-trash.gif'
import MediaIcon from "./common/MovieIcon"

import './Documents.css'
import Hideable from "./common/Hideable";
import { useEffect, useState } from "react";

const seasonStr = (seasons: Season[]) => {
    const str = seasons.length > 1 ? 'Seasons' : 'Season'

    return `${seasons.length} ${str}`
}

interface OpenProps {
    openVideo: (path: string) => void
    openFolder: (path: string) => void
}

interface DocProps extends OpenProps {
    d: QueryResult
    setDoc: (d: QueryResult) => void
}

const DocRow = ({ d, setDoc, openVideo, openFolder }: DocProps) =>
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
            {d.path && <PlayButton onClick={() => d.path && openVideo(d.path)} />}
            <FolderButton onClick={() => openFolder(d.folderPath)} />
        </div>
    </div>

interface DocsProps extends OpenProps {
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

const Docs = ({ docs, setDoc, initialResultsFetched, openFolder, openVideo }: DocsProps) => {
    return (
        <>
            {docs.length > 0 ? docs.map(doc => (
                <DocRow key={doc.title + doc.path} setDoc={setDoc} d={doc} openFolder={openFolder} openVideo={openVideo}/>
            )) :
                !initialResultsFetched ? <></> : <NoResuls numOfDocs={docs.length}/>
            }
        </>
    )
}

const Documents = ({docs, setDoc, initialResultsFetched, openFolder, openVideo}: DocsProps) => 
    <div className='docContainer'>
        <Docs docs={docs} setDoc={setDoc} initialResultsFetched={initialResultsFetched} openFolder={openFolder} openVideo={openVideo}/>
    </div>

export default Documents