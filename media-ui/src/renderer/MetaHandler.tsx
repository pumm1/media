import { useCallback, useEffect, useRef, useState } from "react"
import { QueryResult, Season, Episode, rescanMedia, preview, suggestMedias, QueryReq, MetaResponse, Rating } from "./MediaClient"
import LoadingIndicator from "./common/LoadingIndicator"
import {PlayButton, FolderButton, RefreshButton} from "./common/CommonButtons"
import Hideable from "./common/Hideable"
import MediaIcon from "./common/MovieIcon"
import Suggestion from "./Suggestion"
import { Tags } from "./Documents"

import './MetaHandler.css'
import { AwardIcon, ImdbIcon, MetaCiritcIcon, RottenTomatoesIcon }from "./common/CommonIcon"

interface PossibleError {
    error?: string
}

export interface MetaInfo extends MetaResponse, PossibleError {
}

interface SeasonInfoProps {
    seasons: Season[]
    playMedia: (path: string) => void
}

const sortedEpisodes = (episodes: Episode[]) =>
    episodes.sort((a,b) => {
        if (a.name.toLowerCase() < b.name.toLowerCase()) {
            return -1
        } else if (a.name.toLowerCase() > b.name.toLowerCase()) {
            return 1
        } else {
            return 0
        }
    })

interface EpisodeInfoProps {
    episodes: Episode[]
    playMedia: (path: string) => void
}

const SeasonEpisodesInfo = ({episodes, playMedia}: EpisodeInfoProps) => 
    <div className="episodEcontainer">
        {sortedEpisodes(episodes).map((e, idx) => <div key={e.path + idx} className="episode">{e.name} <PlayButton onClick={() => playMedia(e.path)}/></div>)}
    </div>

const SeasonInfo = ({seasons, playMedia}: SeasonInfoProps) => 
    <div className="seasonsContainer">
        <Hideable contentName="Seasons">
            {seasons.map((s, idx) => 
                <div key={s.name + idx} className="seasonContainer">
                    <Hideable contentName={s.name}><SeasonEpisodesInfo playMedia={playMedia} episodes={s.episodes}/></Hideable>
                </div>)
            }
        </Hideable>
    </div>

// const imgScaler = 200

interface MetaInfoProps extends MetaInfo {
    infoLoading: boolean
    playMedia: (path: string) => void
    onOpenFolder: () => void
    doc: QueryResult
    onClose: () => void
    updateMediasFn: () => void
    setDoc: (d: QueryResult) => void
    metaInfo?: MetaResponse
}
interface Source {
    source: string,
    icon: JSX.Element
}
const sourceImdb: Source = {
    source: 'Internet Movie Database',
    icon: <ImdbIcon />
}
const sourceRottenTomateos: Source =  {
    source: 'Rotten Tomatoes',
    icon: <RottenTomatoesIcon />
}
const sourceMetaCritic: Source = {
    source: 'Metacritic',
    icon: <MetaCiritcIcon />
}

const sources: Source[] = [sourceImdb, sourceRottenTomateos, sourceMetaCritic]

const RatingInfo = ({rating}: {rating: Rating}) => {
    const source = sources.find(s => s.source === rating.Source)

    return source ? <span className="minorInfo">{source.icon} {rating.Value}</span> : <></>
}

const resolveRatings = (ratings: Rating[]) =>
    <span className="minorInfo">
        {ratings.map(r => <RatingInfo rating={r}/>)}
    </span>

const MetaInfoModal = ({ infoLoading, setDoc, updateMediasFn, Title, playMedia, doc, onOpenFolder, onClose, metaInfo }: MetaInfoProps) => {
    const componentRef = useRef<HTMLDivElement | null>(null)

    const [suggestions, setSuggestions] = useState<QueryResult[] | undefined>(undefined)

    useEffect(() => {
        setSuggestions(undefined) // Clear old suggestions immediately
        const suggestionQ: QueryReq = {
            tags: doc.tags,
            titles: [doc.title],
            types: [doc.type],
            sort: 'title',
            sortDirection: 'default',
            page: 0,
            pageSize: 100
        }
        suggestMedias(suggestionQ).then(setSuggestions)
    }, [doc.tags, doc.type, doc.title])

    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (componentRef.current && !componentRef.current.contains(event.target as Node)) {
            onClose()
        }
    }, [onClose]) // Dependencies for useCallback

    const handleEscape = useCallback((event: KeyboardEvent) => {
        if (componentRef.current && !componentRef.current.contains(event.target as Node) && event.key === 'Escape') {
            onClose()
        }
    }, [onClose]) // Dependencies for useCallback

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [handleClickOutside])

    const rescanFn = () => rescanMedia(doc.uuid).then(() => updateMediasFn())

    const onRescan = () => 
        Promise.resolve(onClose()).then(() => rescanFn())

      useEffect(() => {//should allow the escaping with keyboard in all situations
        setTimeout(() => {
            componentRef.current?.focus();
        }, 0) // Delay ensures DOM is ready
    }, [])
    /*

            <img src={image} alt="Not found" width={0.675*imgScaler} height={1*imgScaler}></img>
            we recommend a vertical alignment (i.e. portrait orientation) with an aspect ratio of 1:0.675 
     */


    const RunTimePart = ({}) =>
        metaInfo?.Runtime ? <span className="minorInfo">{metaInfo.Runtime}</span> : <></>
    const Ratings = ({}) => infoLoading ? <LoadingIndicator /> : 
        metaInfo?.Ratings ? resolveRatings(metaInfo.Ratings): <></>
    const Buttons = ({}) => 
        <div className="buttons">
            {doc.path && <PlayButton onClick={() => doc.path && playMedia(doc.path)}/> }
            <FolderButton onClick={onOpenFolder}/>
            <RefreshButton onClick={() => onRescan()} />
            <RunTimePart />
            <Ratings />
        </div>
    const TitlePart = ({}) =>
        <a href={doc.imdb} target="_blank" rel="noopener noreferrer"><h2>{Title}</h2></a>

    const PlotPart = ({}) =>
        <div className="info">{metaInfo?.Plot ?? ''}</div>
    
    const SeriesSeasonInfo = ({}) =>
        <div className="seasonsAndImg">
            {doc.seasons ? <SeasonInfo playMedia={playMedia} seasons={doc.seasons}/> : <div></div>}
        </div>

    const Suggestions = ({}) =>
        <div className="metaPartBottom">
            {
            suggestions && suggestions.length > 0 && 
                <div className="suggestionsContainer">
                    <h3>You Might Also Like...</h3>
                    <div className="suggestions">
                        {suggestions.map((s, idx) => <Suggestion key={s.uuid + idx} setDoc={setDoc} doc={s}/>)}
                    </div>
                </div>
            }
        </div>

    const AwardsPart = ({}) =>
        (metaInfo?.Awards && metaInfo.Awards !== 'N/A') ? <span className="minorInfo"> <AwardIcon />{metaInfo.Awards}</span> : <></>

    return(
        <>
        {metaInfo?.Poster && <div className='metaBackgroundImg' style={{'backgroundImage': `url(${metaInfo.Poster})`, 'backgroundPosition': 'center', 'backgroundSize': 'contain', backgroundRepeat: 'no-repeat'}}/> }
        <div tabIndex={0} className="infoContainer" ref={componentRef} onKeyDown={e => {
            if (e.key === 'Escape') {
                onClose()
            }
        }}>
             <div className="metaParts">
                <div className="metaPartTop">
                    <TitlePart />
                    <MediaIcon type={doc.type}/>
                    <Tags doc={doc} />
                    <Buttons />
                    <PlotPart />
                    <AwardsPart />
                    <SeriesSeasonInfo />
                </div>
                <Suggestions />
             </div>
        </div>
        </>
    )
}

export interface MetaInfoByUrlProps {
    metaInfo?: MetaInfo
    doc: QueryResult
    playMedia: (path: string) => void
    onOpenFolder: () => void
    onClose: () => void
    updateMediasFn: () => void
    setDoc: (d: QueryResult) => void
}

const MetaInfoByUrl = ({ setDoc, metaInfo, updateMediasFn, doc, playMedia, onOpenFolder, onClose }: MetaInfoByUrlProps) => {
    const placeHolderInfo: MetaInfo = {
        Title: doc.title
    }
    const [currentMetaInfo, setMetaInfo] = useState<MetaInfo>(metaInfo || placeHolderInfo)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (doc.imdb) {
            setIsLoading(true)
            preview(doc.imdb).then(info => {
                setIsLoading(false)
                setMetaInfo(info)
            })
        }
    }, [doc.imdb])

    return (
        currentMetaInfo ? 
            <MetaInfoModal metaInfo={currentMetaInfo} infoLoading={isLoading} setDoc={setDoc} updateMediasFn={updateMediasFn} onClose={onClose} doc={doc} onOpenFolder={onOpenFolder} playMedia={path => playMedia(path)} Title={currentMetaInfo.Title || placeHolderInfo.Title}/>
        :  
            <></>
    )
}

// Example usage
//fetchLinkPreview('https://example.com').then(preview => console.log(preview))
export default MetaInfoByUrl