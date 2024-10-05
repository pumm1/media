# Simple home media manager

This software is for managing media files (movies and series). 
Anyone using this should themselves own the media by legal means (e.g. buy a DVD or Blu-Ray and rip it for their own personal usage and easier storage)


In `/src`, include `sources.json` with each source directory in the `directories` array:
```
{
  directories: [
    "<absolute_path_to_dir1>",
    "<absolute_path_to_dir2>",
    ....
  ]
}
``` 

Under each `<absolute_path_to_dir` have folders for `Movies` and `Series`. 
So each directory looks like such:
```
├── <soruce_dir>
│   ├── Movies
│   ├── Series
...
```

Each movie should be in their own folder with a `meta.json` file, so the directory structure is as follows:
```
//under each source dir
...
├── Movies
│   ├── Foobar
│   │   ├── foobar.mkv
│   │   └── meta.json
│   ├── Test
│   │   ├── test.mp4
│   │   └── meta.json
...
```
The `meta.json` file has the following structure:
```
{
  "title": "<Title goes here>", 
  "imdb": "<link to the IMDB page>", 
  "tags": ["horror", "action", "sci-fi"], 
  "type": "movie"
}
```

Once the software scans the `directories` folder(s), it updates a given title's `meta.json` 
with `"added": true` to keep track what's been added and what has not.  
When `meta.json` is not found, the software includes a template of `meta.json` 
with slightly different file name just not to include the items with possibly wrong data to the DB. 
Once the file is modified accordingly and renamed to `meta.json`, it'll get detected by the software.

Series have a similar structure to the movies, but they should also have each season in their own folders.
So the series structure should be as follows:
```
//under each source dir
//episode names don't really matter
...
── Series
│   ├── some series
│   │   ├── meta.json
│   │   └── season 1
│   │       ├── S01E01.mp4
│   │       ├── S01E02.mp4
│   │       ├── S01E03.mp4
│   │   └── season 2
│   │       ├── S02E01.mp4
│   │       ├── S02E02.mp4
...
```
Series are added only once, but the system can recognize if new episodes or seasons have been added to the series, and it then updates the series seasons.

When media folder isn't found anymore in the file structure on scan, it's removed from the MongoDB and it's not searchable anymore. 

## Setup

- Install MongoDB
- Install Python3 (> 3.10)
  - Install dependencies mentioned in `/src/requirements.txt`
- Install Yarn & NPM

### MongoDB
- Create collection for media in the MongoDB shell:
```
db.createCollection("media", {"validator": {"$jsonSchema": {"bsonType": "object", "required": ["created", "title", "imdb", "type", "tags", "folderPath"], "properties": {"created": {"bsonType": "date"}, "title": {"bsonType": "string", "description": "must be a string and is required"}, "imdb": {"bsonType": "string", "description": "must be a string and is required"}, "type": {"bsonType": "string", "description": "must be a string and is required"}, "folderPath": {"bsonType": "string", "description": "must be a string and is required"}, "path": {"bsonType": "string", "description": "must be a string"}, "tags": {"bsonType": "array", "items": { "bsonType": "string" }, "description": "must be an array of strings"}, "seasons":  {"bsonType":  "array", "items":  {"bsonType": "object", "properties": {"season": {"bsonType": "object", "properties": {"name": {"bsonType": "string"}, "episodes": {"bsonType": "array", "items": {"bsonType": "object", "properties": {"name": {"bsonType": "string"}, "path": {"bsonType": "string"}}}, "description": "must be an array of objects with name and path"}}}}}, "properties":  {}}}}}})
```

### Backend
- In `/src` run `flask --app app run`

### UI
- in `/media-ui` run `yarn start` (for UI) and `yarn electron` (to be able to use Electron version of the app and actually access folders/files)
- Open UI and scan for updates
