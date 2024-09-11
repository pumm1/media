import axios from "axios";
import {load} from 'cheerio'
import { useEffect, useRef, useState } from "react";
import { QueryResult, Season, Episode, createUrl, preview } from "./MediaClient";
import LoadingIndicator from "./common/LoadingIndicator";
import './MetaHandler.css'
import {PlayButton, FolderButton} from "./common/CommonButtons";
import Hideable from "./common/Hideable";
import MediaIcon from "./common/MovieIcon";


export interface MetaInfo {
    title?: string
    info?: string
    description?: string
    image?: string
}

const resolveLinkMeta = async (url: string): Promise<MetaInfo| undefined> => {
  try {
    const { data } = await axios.post(createUrl('/preview'), {url})
    const $ = load(data)

    const title = $('meta[property="og:title"]').attr('content') || $('title').text()
    const info = $('meta[property="og:description"]').attr('content')
    const description = $('meta[name="description"]').attr('content')
    const image = $('meta[property="og:image"]').attr('content')
    //const link = $('meta[property="og:url"]').attr('content') || url;

    return {
        title,
        info,
        description,
        image,
        
    }
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

interface MetaInfoProps extends MetaInfo {
    playMedia: (path: string) => void
    onOpenFolder: () => void
    doc: QueryResult
    onClose: () => void
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

const imgScaler = 30

const MetaInfo = ({title, description, info, image, playMedia, doc, onOpenFolder, onClose}: MetaInfoProps) => {
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

    return(
        <div className="metaContainer" ref={componentRef}>
            <a href={doc.imdb}><h2>{title}</h2></a>
            <p>{info}</p>
            <MediaIcon type={doc.type}/>
            <div className="buttons">
                {doc.path && <PlayButton onClick={() => doc.path && playMedia(doc.path)}/> }
                <FolderButton onClick={onOpenFolder}/>
            </div>
            <p>{description ?? ''}</p>
            <div className="seasonsAndImg">
                {doc.seasons ? <SeasonInfo playMedia={playMedia} seasons={doc.seasons}/> : <div></div>}
                <img src={image} width={9*imgScaler} height={16*imgScaler}></img>
            </div>
        </div>
    )
}

export interface MetaInfoByUrlProps {
    doc: QueryResult
    playMedia: (path: string) => void
    onOpenFolder: () => void
    onClose: () => void
}
const MetaInfoByUrl = ({doc, playMedia, onOpenFolder, onClose}: MetaInfoByUrlProps) => {
    const [metaInfo, setMetaInfo] = useState<MetaInfo | undefined>(undefined)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (doc.imdb) {
            setIsLoading(true)
            resolveLinkMeta(doc.imdb).then(info => {
                setIsLoading(false)
                setMetaInfo(info)
            })
        }
    }, [doc])
    //metaInfo ? <MetaInfo onClose={onClose} doc={doc} onOpenFolder={onOpenFolder} playMedia={path => playMedia(path)} title={metaInfo.title} info={metaInfo.info} description={metaInfo.description} image={metaInfo.image}/> :  <></>

    return (
        isLoading ? <LoadingIndicator /> :
        metaInfo ? <MetaInfo onClose={onClose} doc={doc} onOpenFolder={onOpenFolder} playMedia={path => playMedia(path)} title={metaInfo.title} info={metaInfo.info} description={metaInfo.description} image={metaInfo.image}/> :  <></>
    )
}

// Example usage
//fetchLinkPreview('https://example.com').then(preview => console.log(preview));
export default MetaInfoByUrl