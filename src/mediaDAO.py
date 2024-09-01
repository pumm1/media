from pymongo import MongoClient

client = MongoClient('localhost', 27017)

db_name = 'testDb'

db = client.get_database(db_name)

print(db.name)

def with_mongo_client(collection_fn):
    with MongoClient('localhost', 27017) as client:
        db = client.get_database(db_name)
        collection = db.get_collection(collection_name)
        collection_fn(collection)
        client.close()

#collection_name = 'myCollection' #TODO: change after figuring out some collection structure
collection_name = 'my_media'

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
    if not collection_exists:
        print(f'Creating collection {collection_name}')
        db.create_collection(collection_name, codec_options=schema, check_exists=True)
        print(f'Collection created')
    else:
        print(f'Collection {collection_name} already exists')


def add_media_to_collection_fn(m_json):
    collection = db.get_collection(collection_name)
    # Insert a document into the collection
    if collection is not None:
        collection.insert_one(m_json)
    else:
        print(f'.... collection not found')


def add_media_to_collection(m_json):
    with MongoClient('localhost', 27017) as client:
        db = client.get_database(db_name)
        collection = db.get_collection(collection_name)
        if collection is not None:
            print(f'Inserting data: {m_json}')
            collection.insert_one(m_json)
        else:
            print(f'.... collection not found')


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
                        'path': 1
                    }
                )
            )
        else:
            print(f'.... collection not found')
            return []


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
