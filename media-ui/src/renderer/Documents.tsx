import { HDR, ISODateString, MetaResponse, QueryResult, Season, mediaHasHdrByUuid, preview } from "./MediaClient"
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

interface TagsProps {
    doc: QueryResult
}

export const Tags = ({ doc }: TagsProps) => 
    <div className='tagContainer'>
        {
            doc.tags.map(t =>
                <span key={doc.title + t} className='tag'>
                    {t.toUpperCase()}
                </span>
            )
        }
    </div>


interface DocProps {
    idx: number
    d: QueryResult
    setDoc: (d: QueryResult) => void
    sinceWeeksAgo: number
}

const DocRow = ({ d, idx,  setDoc, sinceWeeksAgo }: DocProps) => {
    const [metaInfo, setMetaInfo] = useState<MetaResponse | undefined>(undefined)
    const [hasHdr, setHasHdr] = useState<HDR | null>(null)

    const containerRef = useRef<HTMLDivElement | null>(null)

    const img = metaInfo?.image

    useEffect(() => {
        preview(d.imdb).then(setMetaInfo).then(() => {
            mediaHasHdrByUuid(d.uuid).then(setHasHdr)
        })
    }, [d.imdb])
    //{img && <img className='image' src={img} width={0.675*smallImgScaler} height={1*smallImgScaler}></img>}

    return (
        <div onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDoc(d)}} ref={containerRef} className="documentContainer" tabIndex={1} data-index={idx}>
            {
                img ? 
                <div className='documentImage' style={{'backgroundImage': `url(${img})`}}/> 
                : <h2 style={{textAlign: 'center'}}>{d.title}</h2>
            }
            <div className='document'>
                <span className="infoContainer">
                    <div className='mediaInfo'>
                        <MediaIcon type={d.type}/> 
                        {hasHdr && <Pill variant='Static' keyProp={d.title + 'hdr'}>HDR</Pill>}
                        {d.seasons && <div className='seasonInfo'>{seasonStr(d.seasons)}</div>}
                        <FadingCompoennt isVisible={isNew(d.created, sinceWeeksAgo)}>
                            <Pill variant='Static' keyProp={d.title}>New!</Pill>
                        </FadingCompoennt>
                    </div>
                    <Tags doc={d} />
                </span>
            </div>
        </div>
    )
}

interface DocsPropsMain {
    docs: QueryResult[]
    setDoc: (d: QueryResult) => void
    initialResultsFetched: boolean, 
    sinceWeeksAgo: number
}

interface DocsProps extends DocsPropsMain {
    tryToFetchMoreDataFn: () => void
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

const Docs = ({ docs, setDoc, initialResultsFetched, sinceWeeksAgo }: DocsPropsMain) => {
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

const Documents = ({ docs, setDoc, initialResultsFetched, sinceWeeksAgo, tryToFetchMoreDataFn }: DocsProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const handleScroll = () => {
          const container = containerRef.current
          if (!container) return
    
          const scrollTop = container.scrollTop // Current scroll position from the top
          const scrollHeight = container.scrollHeight // Total scrollable height
          const clientHeight = container.clientHeight // Visible height of the container
    
          const threshold = 100

          // Check if the user is at the bottom
          if (scrollHeight - scrollTop - clientHeight <= threshold) {
            tryToFetchMoreDataFn() // Trigger data fetch
          }
        }
    
        const currentContainer = containerRef.current;
        currentContainer?.addEventListener("scroll", handleScroll)
    
        return () => {
          currentContainer?.removeEventListener("scroll", handleScroll)
        }
      }, [tryToFetchMoreDataFn, containerRef])

    return(
        <div className='docContainer' ref={containerRef}>
            <Docs sinceWeeksAgo={sinceWeeksAgo} docs={docs} setDoc={setDoc} initialResultsFetched={initialResultsFetched} />
        </div>
    )
}

export default Documents