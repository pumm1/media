import { ISODateString, MetaResponse, QueryResult, Season, preview } from "./MediaClient"
import errorGif1 from './angry-panda.gif';
import errorGif2 from './monke-pc.gif'
import errorGif3 from './throw-pc.gif'
import errorGif4 from './pc-trash.gif'
import MediaIcon from "./common/MovieIcon"
import Hideable from "./common/Hideable"
import { useEffect, useRef, useState } from "react"
import { Pill } from "./common/Selection"
import FadingCompoennt from "./common/FadingComponent"

import './Documents.css'

const seasonStr = (seasons: Season[]) => {
    const str = seasons.length > 1 ? 'Seasons' : 'Season'

    return `${seasons.length} ${str}`
}

const isNew = (date: ISODateString, sinceWeeksAgo: number): boolean => {
    const now = new Date()
    const oneWeekInPast = new Date().setDate(now.getDate() - (7 * sinceWeeksAgo))

    return Date.parse(date) > oneWeekInPast
}

interface DocProps {
    idx: number
    d: QueryResult
    setDoc: (d: QueryResult) => void
    sinceWeeksAgo: number
}

const DocRow = ({ d, idx,  setDoc, sinceWeeksAgo }: DocProps) => {
    const [metaInfo, setMetaInfo] = useState<MetaResponse | undefined>(undefined)

    const containerRef = useRef<HTMLDivElement | null>(null)

    const handleHover = () => {
        if (containerRef.current) {
            containerRef.current.focus()  // Focus the element on hover
        }
    };

    const img = metaInfo?.image

    useEffect(() => {
        preview(d.imdb).then(setMetaInfo)
    }, [d.imdb])
    //{img && <img className='image' src={img} width={0.675*smallImgScaler} height={1*smallImgScaler}></img>}

    return (
        <div onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDoc(d)}} ref={containerRef} className="documentContainer" tabIndex={1} data-index={idx}>
            {
                img ? 
                <div className='documentImage' style={{'backgroundImage': `url(${img})`, 'backgroundSize': 'cover', 'maskImage': 'linear-gradient(to bottom, transparent, var(--main-dark) 100%, var(--main-dark) 100%, transparent)'}}/> 
                : <h2 style={{textAlign: 'center'}}>{d.title}</h2>
            }
            <div className='document'>
                <span className="infoContainer">
                    <div className='mediaInfo'>
                        <MediaIcon type={d.type}/> 
                        {d.seasons && <div className='seasonInfo'>{seasonStr(d.seasons)}</div>}
                        <FadingCompoennt isVisible={isNew(d.created, sinceWeeksAgo)}>
                            <Pill variant='Static' keyProp={d.title}>New!</Pill>
                        </FadingCompoennt>
                    </div>
                    <div className='tagContainer'>
                        {
                            d.tags.map(t =>
                                <span key={d.title + t} className='tag'>
                                    {t.toUpperCase()}
                                </span>)
                        }
                    </div>
                </span>
            </div>
        </div>
    )
}

interface DocsProps {
    docs: QueryResult[]
    setDoc: (d: QueryResult) => void
    initialResultsFetched: boolean, 
    sinceWeeksAgo: number
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
                <img src={ErrorGifs[randGif]} alt="Not found" />
                </>
            </Hideable>
        </div>
    )
}

const Docs = ({ docs, setDoc, initialResultsFetched, sinceWeeksAgo }: DocsProps) => {
    return (
        <>
            {docs.length > 0 ? docs.map((doc, idx) => (
                <DocRow idx={idx} sinceWeeksAgo={sinceWeeksAgo} key={doc.title + doc.path} setDoc={setDoc} d={doc}/>
            )) :
                !initialResultsFetched ? <></> : <NoResuls numOfDocs={docs.length}/>
            }
        </>
    )
}

const Documents = ({ docs, setDoc, initialResultsFetched, sinceWeeksAgo }: DocsProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (docs.length > 0) {
            const firstDoc = document.querySelector<HTMLDivElement>(".documentContainer[data-index='0']")
            if (firstDoc) {
                firstDoc.focus()
            }
        }
    }, [docs]);


    return(
        <div className='docContainer' ref={containerRef}>
            <Docs sinceWeeksAgo={sinceWeeksAgo} docs={docs} setDoc={setDoc} initialResultsFetched={initialResultsFetched} />
        </div>
    )
}

export default Documents