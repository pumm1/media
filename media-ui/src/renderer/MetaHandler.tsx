import axios from "axios";
import {load} from 'cheerio'
import { useEffect, useState } from "react";
import { QueryResult, createUrl, preview } from "./MediaClient";
import LoadingIndicator from "./LoadingIndicator";
import './MetaHandler.css'
import {PlayButton, FolderButton} from "./CommonButtons";


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
    onPlay: () => void
    onOpenFolder: () => void
    imdb: string
}

const MetaInfo = ({title, description, info, image, onPlay, imdb, onOpenFolder}: MetaInfoProps) => 
        <div className="metaContainer">
            <a href={imdb}><h2>{title}</h2></a>
            <p>{info}</p>
            <div className="buttons"><PlayButton onClick={onPlay}/> <FolderButton onClick={onOpenFolder}/></div>
            <p>{description ?? ''}</p>
            <img src={image} width={9*40} height={16*40}></img>
        </div>

export interface MetaInfoByUrlProps {
    doc: QueryResult
    onPlay: () => void
    onOpenFolder: () => void
}
const MetaInfoByUrl = ({doc, onPlay, onOpenFolder}: MetaInfoByUrlProps) => {
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

    return (
        isLoading ? <LoadingIndicator /> :
        metaInfo ? <MetaInfo imdb={doc.imdb} onOpenFolder={onOpenFolder} onPlay={onPlay} title={metaInfo.title} info={metaInfo.info} description={metaInfo.description} image={metaInfo.image}/> :  <></>
    )
}

// Example usage
//fetchLinkPreview('https://example.com').then(preview => console.log(preview));
export default MetaInfoByUrl