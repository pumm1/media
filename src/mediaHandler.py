import json
from mediaDAO import add_media_to_collection, query_collections, existing_files, remove_media_by_files, existing_tags
import os
from bson.json_util import dumps, loads
from pandas.core.common import flatten

from queryReq import QueryReq
from queryBuilder import m_json_from_req, title_f, type_f, tags_f, imdb_f, path_f, medias_to_remove_json

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

def search_collections(q: QueryReq):
    m_json = m_json_from_req(q)

    res = query_collections(m_json)
    """
    print(f'Amount of docs found: {len(res)}')
    for doc in res:
        print(f'Doc in results: {doc}')
    """

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


def get_existing_titles():
    files = existing_files()
    existing = []
    for file in files:
        print(file)
        existing.append(file[path_f])

    return existing

def get_existing_tags():
    all_tags = existing_tags()
    existing = []
    for tags in all_tags:
        existing.append(tags[tags_f])

    return sorted(set(flatten(existing)))

def remove_medias_by_files(files: list[str]):
    q_json = medias_to_remove_json(files)
    removed = remove_media_by_files(q_json)
    print(f'Removed {removed} titles')
    return removed


#TODO: how to handle shows
def go_through_medias():
    added = 0
    removed = 0
    medias = os.listdir(medias_dir)
    existing = get_existing_titles()
    found_files = []
    for media in medias:
        media_dir = os.path.join(medias_dir, media)
        files = os.listdir(media_dir)
        meta_file_path = None
        meta_data = None
        media_file_path = None
        has_been_added = False
        media_has_been_removed = False
        for file in files:
            print(f'[{media}] File: {file}')
            media_path = os.path.join(media_dir)
            if is_meta(file):
                meta_file_path = os.path.join(media_path, file)
                print(f'meta_path: {meta_file_path}')
                (has_been_added, meta_data) = file_has_been_added(meta_file_path)
            #TODO: make sure it's media file (mkv, mp4, mov)
            elif is_media_file(file):
                if media_file_path is None:
                    media_file_path = os.path.join(media_path, file)
                    found_files.append(media_file_path)
                else:
                    print(f'Extra media file found in {media}!')
        if (not has_been_added) and media_file_path is not None:
            save_media_info(meta_data, media_file_path)
            update_meta(meta_data, meta_file_path)
            added = added + 1

    existing_set = set(existing)
    found_set = set(found_files)

    files_to_be_removed = list(existing_set - found_set)

    print(f'Should be removed: {files_to_be_removed}')
    removed = remove_medias_by_files(files_to_be_removed)

    return { 'added': added, 'removed': removed }


#go_through_medias()

#search_collections()

#temp_test_query_making()
