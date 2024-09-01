import React, { useEffect, useState } from 'react';
import { QueryReq, QueryResult, createSearchParams, searchMedia } from './MediaClient';

const Doc = (d: QueryResult) => 
    <div>
        <h2>{d.title}</h2>
        <span>{d.tags.map(t => t.toUpperCase()).join(', ')}</span>
        <button onClick={() => console.log('CLICK')}>Watch</button>
    </div>

const MediaBrowser = () =>  {
    const [docs, setDocs] = useState<QueryResult[]>([])

    const q: QueryReq = {
        titles: ['er'],
        tags: ['action'],
        types: ['movie']
    }

  const params = createSearchParams(q)

  useEffect(() => {
    searchMedia(q).then(setDocs)
  }, [])

  return (
    <div>
        {docs.map(Doc)}
    </div>
  )
}

export default MediaBrowser
