import React from 'react';
//import logo from './logo.svg';
import './App.css';
import { QueryReq, createSearchParams, searchMedia } from './MediaClient';
import MediaBrowser from './MediaBrowser';

const App = () =>  {
  const q: QueryReq = {
    titles: ['er'],
    tags: ['action'],
    types: ['movie']
  }

  const params = createSearchParams(q)

  searchMedia(q).then(res => console.log(`res: ${res}`))

  return <MediaBrowser />
}

export default App;
