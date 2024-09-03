import axios from "axios";
import {load} from 'cheerio'
import { useEffect, useState } from "react";
import { QueryResult, createUrl } from "./MediaClient"
import LoadingIndicator from "./LoadingIndicator"
import PlayButton from "./PlayButton"
import './MetaHandler.css'


/*
for later:
  416  yarn add lodash
  421  yarn add react-player
  427  yarn add electron --dev
  428  yarn add --dev typescript @types/node @types/electron ts-node
  452  yarn add axios cheerio
*/
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
}

const MetaInfo = ({title, description, info, image, onPlay}: MetaInfoProps) => 
        <div className="metaContainer">
            <h2>{title}</h2>
            <div>
                <p>{info}</p><PlayButton onClick={onPlay}/>
            </div>
            <p>{description ?? ''}</p>
            <img src={image} width={9*40} height={16*40}></img>
        </div>

export interface MetaInfoByUrlProps {
    doc: QueryResult
    onPlay: () => void
}
const MetaInfoByUrl = ({doc, onPlay}: MetaInfoByUrlProps) => {
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
        metaInfo ? <MetaInfo onPlay={onPlay} title={metaInfo.title} info={metaInfo.info} description={metaInfo.description} image={metaInfo.image}/> :  <></>
    )
}

// Example usage
//fetchLinkPreview('https://example.com').then(preview => console.log(preview));
export default MetaInfoByUrl