import React from 'react';
//import logo from './logo.svg';
import './App.css';
import { QueryReq, createSearchParams, searchMedia } from './MediaClient';
import MediaBrowser from './MediaBrowser';

const App = () => 
<div className='App'>
  <MediaBrowser />
</div>

export default App;
