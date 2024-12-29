const pathBase = "http://127.0.0.1:5000"

export const createUrl = (path: string): string => 
    `${pathBase}${path}`;

    

const fetchData = (path: string) => 
    fetch(createUrl(path)).then(res => res.json());


const fetchDataAs = <T,>(path: string) =>
    fetchData(path).then(res => res as T)

const postData = (path: string, data: any) => {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }

    return fetch(createUrl(path), requestOptions)
}

const postDataAs = <T, >(path: string, data: any): Promise<T> => 
    postData(path, data).then(res => {
       return res.json() as T
    })

const putData = (path: string, data: any) => {
    const requestOptions = {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }

    return fetch(createUrl(path), requestOptions)
}

const putDataAs = <T, >(path: string, data: any): Promise<T> => 
    putData(path, data).then(res => {
       return res.json() as T
    })

/*

const deleteData = (path: string, data: any) => {
    const requestOptions = {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }

    return fetch(path, requestOptions)
}

const deleteDataAs = <T, >(path: string, data: any): Promise<T> => 
    deleteData(path, data).then(res => {
        return res.json() as T
    })

const toQueryParams = (params: Record<string, string>) => {
    return Object.keys(params)
        .filter(key => params[key] !== undefined)  // Filter out undefined values
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key] as string)}`)
        .join('&');
}
*/

export type MediaType = 'movie' | 'series'

export type SortType = 'title' | 'created'
export type SortDirection = 'default' | 'reverse'

export interface QueryReq {
    titles: string[]
    types: MediaType[]
    tags: string[]
    sort: SortType
    sortDirection: SortDirection 
}

export interface Episode {
    name: string,
    path: string
}

export interface Season {
    name: string
    episodes: Episode[]
}

export type ISODateString = string & { __brand: "ISODateString" };

export interface QueryResult {
    uuid: string
    title: string
    type: MediaType
    tags: string[]
    imdb: string
    folderPath: string
    path?: string
    created: ISODateString
    seasons?: Season[]
}

const termsAsParam = (values: string[], field: string) => 
    values.map(v => `${field}=${v}`).join('&')
  

export const createSearchParams = (r: QueryReq): string => {
    const titleParams = termsAsParam(r.titles, 'title')
    const tagParams = termsAsParam(r.tags, 'tag')
    const typeParams = termsAsParam(r.types, 'type')
    const sortParam = termsAsParam([r.sort], 'sort')
    const sortDirectionParam = termsAsParam([r.sortDirection], 'sortDirection')

    const params = [titleParams, tagParams, typeParams, sortParam, sortDirectionParam]

    return params.length > 0 ? `?${params.join('&')}` : ''
}

export const getTags = () => 
    fetchDataAs<string[]>(`/tags`)
    
export const searchMedia = (r: QueryReq) => {
    const params = createSearchParams(r)

    return fetchDataAs<QueryResult[]>(`/search-media${params}`)
}

export interface UpdateRes {
    added: number
    updatedSeries: number,
    removed: number
    pendingConfig: number
}

export const updateMedias = () => 
    postDataAs<UpdateRes>(`/update-medias`, {})

export const preview = (url: string) =>
    postData(`/preview`, {url})

interface MetaBase {
    tags: string[]
    imdb: string
    title: string
    type: MediaType
    added?: boolean
    metaPath: string
}

export interface MetaFileInfo extends MetaBase {
    isPending: boolean
}

export const listMetaFiles = () =>
    fetchDataAs<MetaFileInfo[]>('/list-metas')

export interface MetaUpdateReq extends MetaBase {}

export const updateMetaFile = (data: MetaUpdateReq) =>
    putDataAs<boolean>('/update-meta-file', data)

export interface MetaReadyForScanReq {
    metaPath: string
}

export const metaFileReadyForScanning = (data: MetaReadyForScanReq) =>
    putDataAs<boolean>('/meta-file-ready-to-scan', data)

export const rescanMedia = (uuid: string) =>
    putDataAs<boolean>('/rescan-media', uuid)

export const resetMedias = () => 
    putDataAs<boolean>('/reset-medias', {})