from pymongo import MongoClient
import json
from queryBuilder import in_f, title_f
import sqlite3
from mediaObjects import Series

client = MongoClient('localhost', 27017)

db_name = None

"""
### mongoDb for storing file paths, tags etc and faster media searching
### sqlite DB for storing metadata; fetch only once as it's quite slow if not in redis cache
"""

with open('sources.json', 'r') as json_file:
    data = json.load(json_file)
    db = data.get('dbName')
    if db is not None:
        db_name = db
    else:
        print(f'!!! database name not found !!!')

db = client.get_database(db_name)

collections = db.list_collection_names()
print(f"DB: ", db.name)
print(f"Existing collections: ", collections)

collection_name = "media"

if not (collections.__contains__(collection_name)):
    print(f"Creating missing collection: {collection_name}")
    validator = json.load(open("validator.json"))

    db.create_collection(collection_name, validator=validator)
    print(f'Created collection {collection_name}')


meta_db = f"{db_name}.db"
meta_db_conn = sqlite3.connect(meta_db)
meta_table = 'metadata'

class MetaDB:
    def __init__(self, path: str):
        self.conn = sqlite3.connect(path)

    def init_db(self):
        cur = self.conn.execute(
            f"""
                SELECT name FROM sqlite_master WHERE type='table' AND name='{meta_table}';
            """
        )

        row = cur.fetchone()
        if row:
            print(f"{meta_table} exists")
        else:
            print(f'Creating {meta_table}')
            self.conn.execute("""
                        CREATE TABLE IF NOT EXISTS metadata (
                            url TEXT PRIMARY KEY,
                            data TEXT
                        )
                    """)
            self.conn.commit()

    def set(self, url, value: dict):

        params = [url, json.dumps(value)]

        self.conn.execute(
            "INSERT INTO metadata VALUES", params
        )
        self.conn.commit()

    def get(self, url):
        print(f'DEBUG url: .... {url}')
        cur = self.conn.execute(
            "SELECT data FROM metadata WHERE url=?",
            [url]
        )
        row = cur.fetchone()
        return json.loads(row[0]) if row else None

metaDB = MetaDB(meta_db)

metaDB.init_db()

collection_name = 'media'

# ======= MONGO ======= #
def with_mongo_client(collection_fn):
    with MongoClient('localhost', 27017) as client:
        db = client.get_database(db_name)
        collection = db.get_collection(collection_name)
        collection_fn(collection)
        client.close()

def collection_exists() -> bool:
    return db.list_collection_names().__contains__(collection_name)


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


def query_collections(m_json, sort, sort_direction, page: int | None, page_size: int | None):
    sort_by = 'title'
    direction = 1
    if sort_direction is not None:
        direction = sort_direction
    if sort is not None:
        sort_by = sort
    with MongoClient('localhost', 27017) as client:
        db = client.get_database(db_name)
        collection = db.get_collection(collection_name)
        if page is None:
            page = 0
        if page_size is None:
            page_size = 99999
        if collection is not None:
            return list(
                collection.find(
                    m_json,
                    {
                        '_id': 0,
                        'uuid': 1,
                        'title': 1,
                        'imdb': 1,
                        'tags': 1,
                        'type': 1,
                        'path': 1,
                        'seasons': 1,
                        'folderPath': 1,
                        'created': 1
                    }
                ).sort(sort_by, direction).skip(page * page_size).limit(page_size)
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
                        'uuid': 1,
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


def media_by_uuid(uuid: str):
    with MongoClient('localhost', 27017) as client:
        db = client.get_database(db_name)
        collection = db.get_collection(collection_name)
        if collection is not None:
            return list(
                collection.find({
                    'uuid': uuid
                },
                    {
                        '_id': 0,
                        'uuid': 1,
                        'title': 1,
                        'imdb': 1,
                        'tags': 1,
                        'type': 1,
                        'path': 1,
                        'seasons': 1,
                        'folderPath': 1,
                        'created': 1
                    }
                )
            )
        else:
            collection_not_found_warn()
            return []


def medias_by_uuids(uuids: list[str]):
    with MongoClient('localhost', 27017) as client:
        db = client.get_database(db_name)
        collection = db.get_collection(collection_name)
        if collection is not None:
            return list(
                collection.find({
                    'uuid': {
                        in_f: uuids
                        }
                    },
                    {
                        '_id': 0,
                        'uuid': 1,
                        'title': 1,
                        'type': 1,
                        'path': 1,
                    }
                )
            )
        else:
            collection_not_found_warn()
            return []


def update_series_seasons(uuid: str, s: Series):
    with MongoClient('localhost', 27017) as client:
        db = client.get_database(db_name)
        collection = db.get_collection(collection_name)
        print(f"... update {id} with value: {s.asJson()['seasons']}")
        if collection is not None:
            collection.update_one({
                'uuid': uuid
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

def delete_media_by_series_uuids(uuids):
    with MongoClient('localhost', 27017) as client:
        db = client.get_database(db_name)
        collection = db.get_collection(collection_name)
        if collection is not None:
            return collection.delete_many({
                'uuid': {
                    in_f: uuids
                }
            }).deleted_count
        else:
            collection_not_found_warn()
            return 0


def delete_all_medias():
    with MongoClient('localhost', 27017) as client:
        db = client.get_database(db_name)
        collection = db.get_collection(collection_name)
        if collection is not None:
            return collection.delete_many({}).deleted_count
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

def remove_media_by_title(title: str):
    with MongoClient('localhost', 27017) as client:
        db = client.get_database(db_name)
        collection = db.get_collection(collection_name)
        if collection is not None:
            return collection.delete_many({
                title_f: title
            }).deleted_count
        else:
            collection_not_found_warn()
            return 0

# ======= SQLITE ======= #

# TODO: insert data, fetch data, check type

def get_metadata(url: str):
    db = MetaDB(meta_db)

    return db.get(url)

def store_metadata(url: str, data: dict):
    metaDB.set(url, data)


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
