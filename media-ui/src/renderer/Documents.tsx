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
    handleKeyDown: (
        event: React.KeyboardEvent<HTMLDivElement>, 
        itemIndex: number
      ) => void
    idx: number
    d: QueryResult
    setDoc: (d: QueryResult) => void
    sinceWeeksAgo: number
}

const DocRow = ({ d, idx, handleKeyDown, setDoc, sinceWeeksAgo }: DocProps) => {
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
        <div style={{cursor: 'none'}} onMouseEnter={handleHover} ref={containerRef} className="documentContainer" tabIndex={1} onKeyDown={(e) => handleKeyDown(e, idx)} data-index={idx}>
            {
                img ? 
                <div className='documentImage' style={{'backgroundImage': `url(${img})`, 'backgroundSize': 'cover', 'maskImage': 'linear-gradient(to bottom, transparent, var(--main-dark) 100%, var(--main-dark) 100%, transparent)'}}/> 
                : <h2 style={{textAlign: 'center'}}>{d.title}</h2>
            }
            <div className='document' onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setDoc(d)}}
            >
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
    const [isKeyboardNav, setIsKeyboardNav] = useState(false)
    const scrollTimeout = useRef<number | null>(null)
    const [isFocusing, setIsFocusing] = useState(false)

    const focusGridItem = (index: number): void => {
        setIsFocusing(true)
        // Query the element
        const gridItem = document.querySelector(`.documentContainer[data-index="${index}"]`) as HTMLDivElement | null
    
        // Check if the element is found and focusable
        if (gridItem) {
            gridItem.focus()
            gridItem.scrollIntoView({
                behavior: 'smooth', // Optional: For smooth scrolling
                block: 'center', // Scroll so the item is centered in the container
                inline: 'nearest' // Ensure horizontal scroll if needed (use 'start' for left alignment)
            })
            // Allow keyboard inputs again after a slight delay
            setTimeout(() => {
                setIsFocusing(false)
            }, 280) // Adjust the delay if needed
        } else {
            console.error(`Grid item not found for index: ${index}`)
            console.log("Available elements:", document.querySelectorAll(".documentContainer"))
        }
    }

    const handleKeyDown = (
        event: React.KeyboardEvent<HTMLDivElement>, 
        itemIndex: number
      ) => {
        if (isFocusing) return;
        const totalItems = docs.length
        let newIndex: number | undefined
    
        switch (event.key) {
            case 'ArrowUp':
                if (itemIndex - 4 >= 0) {
                    newIndex = (itemIndex - 4)
                }
                setIsKeyboardNav(true)
                break
            case 'ArrowLeft': // Handle single column or row
                if (itemIndex - 1 >= 0) {
                    newIndex = itemIndex - 1
                }
                break
            case 'ArrowDown':
                if ((itemIndex + 4) < totalItems) {
                    newIndex = (itemIndex + 4)
                }
                setIsKeyboardNav(true)
                break
            case 'ArrowRight': // Handle single column or row
                if (itemIndex + 1 < totalItems) {
                    newIndex = itemIndex + 1
                }
                break
            case 'Enter':
                if (itemIndex >= 0 && itemIndex < totalItems) {
                    const doc = docs[itemIndex]
                    if (doc) {
                        setDoc(doc)   
                    }
                }
                break
            default:
                return // Ignore other keys
        }

    
        event.preventDefault()
        if (newIndex !== undefined && isKeyboardNav) {
          focusGridItem(newIndex)

            if (scrollTimeout.current) {
                clearTimeout(scrollTimeout.current)
            }

            // Debounce the scrollIntoView
            scrollTimeout.current = window.setTimeout(() => {
                const focusedItem = document.querySelector(
                    `.documentContainer[data-index="${newIndex}"]`
                ) as HTMLDivElement | null

                focusedItem?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
            }, 650) // Adjust the delay (e.g., 100ms) for smoother navigation
        }
    }

    return (
        <>
            {docs.length > 0 ? docs.map((doc, idx) => (
                <DocRow handleKeyDown={handleKeyDown} idx={idx} sinceWeeksAgo={sinceWeeksAgo} key={doc.title + doc.path} setDoc={setDoc} d={doc}/>
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