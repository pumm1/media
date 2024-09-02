import axios from "axios";
import {load} from 'cheerio'
import { useEffect, useState } from "react";
import { createUrl, preview } from "./MediaClient";
import { JsxElement } from "typescript";


export interface MetaInfo {
    title?: string
    info?: string
    description?: string
    image?: string
}

const resolveLink = (url: string) => preview(url)

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


const MetaInfo = ({title, description, info, image}: MetaInfo) => 
        <div>
            <h2>{title}</h2>
            <p>{info}</p>
            <p>{description ?? ''}</p>
            <img src={image} width={9*50} height={16*50}></img>
        </div>

export interface MetaInfoByUrlProps {
    url: string
}
const MetaInfoByUrl = ({url}: MetaInfoByUrlProps) => {
    const [metaInfo, setMetaInfo] = useState<MetaInfo | undefined>(undefined)

    useEffect(() => {
        resolveLinkMeta(url).then(setMetaInfo)
    }, [url])

    return metaInfo ? <MetaInfo title={metaInfo.title} info={metaInfo.info} description={metaInfo.description} image={metaInfo.image}/> :  <></>
}

// Example usage
//fetchLinkPreview('https://example.com').then(preview => console.log(preview));
export default MetaInfoByUrl