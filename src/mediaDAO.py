from pymongo import MongoClient

from queryBuilder import title_f, in_f
from bson import ObjectId
from mediaObjects import Movie, Series, Season, Episode

client = MongoClient('localhost', 27017)

db_name = 'testDb'

db = client.get_database(db_name)

print(db.name)

#TODO: test how saving series with seasons works with the new schema
"""
create collection
 db.createCollection("media", { validator: { $jsonSchema: { bsonType: "object", required: ["title", "imdb", "type", "tags", "folderPath"], properties: { title: { bsonType: "string", description: "must be a string and is required" }, imdb: { bsonType: "string", description: "must be a string and is required" }, type: { bsonType: "string", description: "must be a string and is required" }, folderPath: { bsonType: "string", description: "must be a string and is required" }, path: { bsonType: "string", description: "must be a string" }, tags: { bsonType: "array", items: { bsonType: "string" }, description: "must be an array of strings" } } } } })
 
 //new version to test with seasons
  
 db.createCollection("media", { validator: { $jsonSchema: { bsonType: "object", required: ["title", "imdb", "type", "tags", "folderPath"], properties: { title: { bsonType: "string", description: "must be a string and is required" }, imdb: { bsonType: "string", description: "must be a string and is required" }, type: { bsonType: "string", description: "must be a string and is required" }, folderPath: { bsonType: "string", description: "must be a string and is required" }, path: { bsonType: "string", description: "must be a string" }, tags: { bsonType: "array", items: { bsonType: "string" }, description: "must be an array of strings" }, season: { bsonType: "object", properties: { name: { bsonType: "string" }, episodes: { bsonType: "array", items: {bsonType: "string"}, description: "must be an array of strings for paths"}}} } } } })
"""
"""
{ validator: 
    { $jsonSchema:
        { bsonType: "object", 
          required: ["title", "imdb", "type", "tags", "folderPath"], 
          properties: { 
              title: { 
                  bsonType: "string", description: "must be a string and is required" 
              }, 
              imdb: { 
                  bsonType: "string", description: "must be a string and is required" 
              }, 
              type: { 
                bsonType: "string", description: "must be a string and is required" 
              }, 
              folderPath: { 
                bsonType: "string", description: "must be a string and is required" 
              }, 
              path: { 
                bsonType: "string", description: "must be a string" 
              }, 
              tags: { 
                bsonType: "array", items: { bsonType: "string" }, description: "must be an array of strings" 
              },
              season: {
                 bsonType: "object", 
                 properties: {
                    name: {
                        bsonType: "string"
                    },
                    episodes: {
                        bsonType: "array", items: { 
                            bsonType: "object", properties: {
                                name: { bsonType: "string" }, path: { bsonType: "string" }
                            } 
                        }, 
                        description: "must be an array of objects with name and path"
                    }
                 }
            }
          } 
      } 
    } 
}

//optional fields:
season {
     bsonType: "object", 
     properties: {
        name: {
            bsonType: "string"
        },
        episodes: {
            bsonType: "array", items: { bsonType: "string" }, description: "must be array of strings of paths"
        }
     }
    
}
"""

collection_name = 'media'

def with_mongo_client(collection_fn):
    with MongoClient('localhost', 27017) as client:
        db = client.get_database(db_name)
        collection = db.get_collection(collection_name)
        collection_fn(collection)
        client.close()

#collection_name = 'myCollection' #TODO: change after figuring out some collection structure

schema = {
    'validator': {
        '$jsonSchema': {
            'bsonType': 'object',
            'required': ['title', 'imdb', 'type', 'tags', 'path'],
            'properties': {
                'title': {
                    'bsonType': "string",
                    'description': "must be a string and is required"
                },
                'imdb': {
                        'bsonType': "string",
                        'description': "must be a string and is required"
                    },
                'type': {
                    'bsonType': "string",
                    'description': "must be a string and is required"
                },
                'path': {
                    'bsonType': "string",
                    'description': "must be a string and is required"
                },
                'tags': {
                    'bsonType': "array",
                    'items': {
                        'bsonType': "string"
                    },
                    'description': "must be an array of strings"
                }
            }
        }
    }
}


def collection_exists() -> bool:
    return db.list_collection_names().__contains__(collection_name)


#should be used only once
#creation isn't working now, has to be done manually with the schema directly to mongoDb
def create_media_collection():
    if not collection_exists():
        print(f'Creating collection {collection_name}')
        db.create_collection(collection_name, codec_options=schema, check_exists=True)
        print(f'Collection created')
    else:
        print(f'Collection {collection_name} already exists')

def collection_not_found_warn():
    print(f'Collection {collection_name} not found')

def add_media_to_collection(m_json):
    with MongoClient('localhost', 27017) as client:
        db = client.get_database(db_name)
        collection = db.get_collection(collection_name)
        if collection is not None:
            print(f'Inserting data: {m_json}')
            collection.insert_one(m_json)
        else:
            collection_not_found_warn()


def query_collections(m_json):
    with MongoClient('localhost', 27017) as client:
        db = client.get_database(db_name)
        collection = db.get_collection(collection_name)
        if collection is not None:
            return list(
                collection.find(
                    m_json,
                    {
                        '_id': 0,
                        'title': 1,
                        'imdb': 1,
                        'tags': 1,
                        'type': 1,
                        'path': 1,
                        'seasons': 1
                    }
                ).sort('title', 1)
            )
        else:
            collection_not_found_warn()
            return []

def existing_movies():
    with MongoClient('localhost', 27017) as client:
        db = client.get_database(db_name)
        collection = db.get_collection(collection_name)
        if collection is not None:
            return list(
                collection.find({
                    'type': 'movie'
                },
                    {
                        '_id': 0,
                        'path': 1
                    }
                )
            )
        else:
            collection_not_found_warn()
            return []


def existing_series():
    with MongoClient('localhost', 27017) as client:
        db = client.get_database(db_name)
        collection = db.get_collection(collection_name)
        if collection is not None:
            return list(
                collection.find({
                    'type': 'series'
                },
                    {
                        '_id': 1,
                        'title': 1,
                        'imdb': 1,
                        'folderPath': 1,
                        'seasons': 1
                    }
                )
            )
        else:
            collection_not_found_warn()
            return []



def existing_tags():
    with MongoClient('localhost', 27017) as client:
        db = client.get_database(db_name)
        collection = db.get_collection(collection_name)
        if collection is not None:
            return list(
                collection.find({},
                    {
                        '_id': 0,
                        'tags': 1
                    }
                )
            )
        else:
            collection_not_found_warn()
            return []


def update_series_seasons(id: ObjectId, s: Series):
    with MongoClient('localhost', 27017) as client:
        db = client.get_database(db_name)
        collection = db.get_collection(collection_name)
        print(f"... update {id} with value: {s.asJson()['seasons']}")
        if collection is not None:
            collection.update_one({
                '_id': id
            }, {
                '$set': {'seasons': s.asJson()['seasons']}
            }, True)

        else:
            collection_not_found_warn()
            return 0


def delete_media_by_ids(ids):
    with MongoClient('localhost', 27017) as client:
        db = client.get_database(db_name)
        collection = db.get_collection(collection_name)
        if collection is not None:
            return collection.delete_many({
                'id': {
                    in_f: ids
                }
            }).deleted_count
        else:
            collection_not_found_warn()
            return 0


def remove_media_by_files(medias_to_delete_json):
    with MongoClient('localhost', 27017) as client:
        db = client.get_database(db_name)
        collection = db.get_collection(collection_name)
        if collection is not None:
            return collection.delete_many(medias_to_delete_json).deleted_count
        else:
            collection_not_found_warn()
            return 0

# Select a collection (it will create one if it doesn't exist)
#collection = db.get_collection(collection_name)

# Insert a document into the collection
#collection.insert_one({"name": "Alice", "age": 25})

# Query the collection
#result = collection.find_one({"name": "John"})
#print(result)

#create_media_collection()

# Close the connection
#client.close()
