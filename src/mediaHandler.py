import json
from mediaDAO import add_media_to_collection, query_collections
import os
from bson.json_util import dumps, loads
from bson import ObjectId

from queryReq import QueryReq
from queryBuilder import m_json_from_req, title_f, type_f, tags_f, imdb_f

current_dir = os.path.dirname(os.path.realpath(__file__))
medias_dir = os.path.join(current_dir, 'medias')


mode_read = 'r'
mode_write = 'w+'

def is_meta(file_name: str) -> bool:
    return file_name == 'meta.json'


def update_meta(data: dict, file_name):
    print(f'Updating meta for {file_name}')
    data['added'] = True
    json_file = open(file_name, mode_write)
    json_file.write(json.dumps(data))
    json_file.close()


def save_media_info(data, path):
    m_json = {
            "title": data[title_f],
            "type": data[type_f],
            "tags": data[tags_f],
            "imdb": data[imdb_f],
            "path": path
        }

    add_media_to_collection(m_json)


def file_has_been_added(file_name: str):
    added_opt = None
    data = None
    with open(file_name, mode_read) as json_file:
        data = json.load(json_file)
        added_opt = data.get('added')
        json_file.close()

    return (added_opt, data)
"""
    m_json = {
        title_f: {
            regex_f: re.compile('term', re.IGNORECASE)
        }
    }
"""

def temp_test_query_making():
    m_json_from_req(QueryReq(["er", "ter"], ['foo'], ["movie"]))


def search_collections(q: QueryReq):
    #QueryReq(["er", "ter"], ['action'], ["foo", "movie"])
    m_json = m_json_from_req(q)

    res = query_collections(m_json)
    print(f'Amount of docs found: {len(res)}')
    for doc in res:
        print(f'Doc in results: {doc}')

    json_str = dumps(res)
    json_res = loads(json_str)

    return json_res



valid_media_file_suffixes = ['.mp4', '.mkv', 'mov']
def is_media_file(file: str) -> bool:
    is_valid = False
    for suffix in valid_media_file_suffixes:
        if file.endswith(suffix):
            is_valid = True
            break
    return is_valid


def go_through_medias():
    added = 0
    medias = os.listdir(medias_dir)
    for media in medias:
        media_dir = os.path.join(medias_dir, media)
        files = os.listdir(media_dir)
        meta_file_path = None
        meta_data = None
        media_file_path = None
        has_been_added = False
        for file in files:
            print(f'[{media}] File: {file}')
            media_path = os.path.join(media_dir)
            if is_meta(file):
                meta_file_path = os.path.join(media_path, file)
                print(f'meta_path: {meta_file_path}')
                (has_been_added, meta_data) = file_has_been_added(meta_file_path)
            #TODO: make sure it's media file (mkv, mp4, mov)
            elif is_media_file(file):
                media_file_path = os.path.join(media_path, file)
        if (not has_been_added) and media_file_path is not None:
            save_media_info(meta_data, media_file_path)
            update_meta(meta_data, meta_file_path)
            added = added + 1

    return added


#go_through_medias()

#search_collections()

#temp_test_query_making()

test_files = ['foo.mp4', 'test.jpg', 'bar.mkv', 'invalid.png', 'baz.mov']

for file in test_files:
    print(f'{file} is valid media: {is_media_file(file)}')

