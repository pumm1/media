import { JsxElement } from "typescript";

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

const putData = (path: string, data: any) => {
    const requestOptions = {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }

    return fetch(path, requestOptions)
}

const deleteData = (path: string, data: any) => {
    const requestOptions = {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }

    return fetch(path, requestOptions)
}

const postDataAs = <T, >(path: string, data: any): Promise<T> => 
    postData(path, data).then(res => {
       return res.json() as T
    })

const putDataAs = <T, >(path: string, data: any): Promise<T> => 
    putData(path, data).then(res => {
        return res.json() as T
    })

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

export type MediaType = 'movie' | 'series'

export interface QueryReq {
    titles: string[]
    types: MediaType[]
    tags: string[]
}

export interface QueryResult {
    title: string
    type: MediaType
    tags: string[]
    imdb: string
    path: string
}

const asRecord = (arr: string[], field: string): Record<string, string> => arr.reduce((acc, value) => {
    acc[field] = value
    return acc;
}, {} as Record<string, string>);

const termsAsParam = (values: string[], field: string) => 
    values.map(v => `${field}=${v}`).join('&')
  

export const createSearchParams = (r: QueryReq): string => {
    const titleParams = termsAsParam(r.titles, 'title')
    const tagParams = termsAsParam(r.tags, 'tag')
    const typeParams = termsAsParam(r.types, 'type')

    const params = [titleParams, tagParams, typeParams]

    return params.length > 0 ? `?${params.join('&')}` : ''
}

export const searchMedia = (r: QueryReq) => {
    const params = createSearchParams(r)

    return fetchDataAs<QueryResult[]>(`/search-media${params}`)
}

export const preview = (url: string) =>
    postData(`/preview`, {url})
