import React from 'react';
import folderImage from './folder.png';
import './FolderIcon.css';

const FolderIcon = () => {
  return (
    <div>
      <img src={folderImage} width={25} height={25} alt="Folder Icon" className="folder-img"/>
    </div>
  );
};

export default FolderIcon;