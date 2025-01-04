import { useCallback, useEffect, useRef, useState } from "react";
import { QueryResult, Season, Episode, rescanMedia, preview, suggestMedias, QueryReq } from "./MediaClient";
import LoadingIndicator from "./common/LoadingIndicator";
import './MetaHandler.css'
import {PlayButton, FolderButton, RefreshButton} from "./common/CommonButtons";
import Hideable from "./common/Hideable";
import MediaIcon from "./common/MovieIcon";
import Suggestion from "./Suggestion";
import { Tags } from "./Documents";

interface PossibleError {
    error?: string
}

export interface MetaInfo extends PossibleError {
    title?: string
    info?: string
    description?: string
    image?: string
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

export const imgScaler = 200

interface MetaInfoProps extends MetaInfo {
    playMedia: (path: string) => void
    onOpenFolder: () => void
    doc: QueryResult
    onClose: () => void
    updateMediasFn: () => void
    setDoc: (d: QueryResult) => void
}

const MetaInfoModal = ({ setDoc, updateMediasFn, title, description, info, image, playMedia, doc, onOpenFolder, onClose }: MetaInfoProps) => {
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
        }
        suggestMedias(suggestionQ).then(setSuggestions);
    }, [doc.tags, doc.type, doc.title])

    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (componentRef.current && !componentRef.current.contains(event.target as Node)) {
            onClose();
        }
    }, [onClose]); // Dependencies for useCallback

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [handleClickOutside])

    const rescanFn = () => rescanMedia(doc.uuid).then(() => updateMediasFn())

    const onRescan = () => 
        Promise.resolve(onClose()).then(() => rescanFn())

    useEffect(() => {
        componentRef.current?.focus(); //requred for using escape to close modal
      }, [])

    return(
        <div tabIndex={0} className="infoContainer" ref={componentRef} onKeyDown={e => {
            if (e.key === 'Escape') {
                onClose()
            }
        }}>
            <a href={doc.imdb} target="_blank" rel="noopener noreferrer"><h2>{title}</h2></a>
            <p>{info !== undefined ? info : '[Info not available]'}</p>
            <MediaIcon type={doc.type}/>
            <Tags doc={doc} />
            <div className="buttons">
                {doc.path && <PlayButton onClick={() => doc.path && playMedia(doc.path)}/> }
                <FolderButton onClick={onOpenFolder}/>
                <RefreshButton onClick={() => onRescan()} />
            </div>
            <p>{description ?? ''}</p>
            <div className="seasonsAndImg">
                {doc.seasons ? <SeasonInfo playMedia={playMedia} seasons={doc.seasons}/> : <div></div>}
                <img src={image} alt="Not found" width={0.675*imgScaler} height={1*imgScaler}></img>
                {/**we recommend a vertical alignment (i.e. portrait orientation) with an aspect ratio of 1:0.675 */}
            </div>
            {suggestions && suggestions.length > 0 && 
                <div className="suggestionsContainer">
                    <h3>Similar titles</h3>
                    <div className="suggestions">
                        {suggestions.map(s => <Suggestion setDoc={setDoc} doc={s}/>)}
                    </div>
                </div>
                }
        </div>
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
    const [currentMetaInfo, setMetaInfo] = useState<MetaInfo | undefined>(metaInfo)
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
        isLoading ? <LoadingIndicator /> :
        currentMetaInfo ? 
            <MetaInfoModal setDoc={setDoc} updateMediasFn={updateMediasFn} onClose={onClose} doc={doc} onOpenFolder={onOpenFolder} playMedia={path => playMedia(path)} title={currentMetaInfo.title} info={currentMetaInfo.info} description={currentMetaInfo.description} image={currentMetaInfo.image}/>
        :  
            <></>
    )
}

// Example usage
//fetchLinkPreview('https://example.com').then(preview => console.log(preview));
export default MetaInfoByUrl