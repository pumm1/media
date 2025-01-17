import json
from mediaDAO import add_media_to_collection, query_collections, existing_movies, remove_media_by_files, existing_tags, \
    existing_series, update_series_seasons, delete_media_by_ids, delete_all_medias, media_by_uuid, \
    remove_media_by_title, medias_by_uuids
import os
from bson import ObjectId
from bson.json_util import dumps, loads
from pandas.core.common import flatten
from datetime import datetime
from queryReq import QueryReq
from queryBuilder import m_json_from_req, title_f, type_f, tags_f, imdb_f, path_f, medias_to_remove_json, folder_path_f, \
    seasons_f, uuid_f
from mediaObjects import Movie, Series, Season, Episode
import uuid
import random
import ffmpeg


current_dir = os.path.dirname(os.path.realpath(__file__))
#medias_dir = os.path.join(current_dir, 'medias')

temp_meta_file_name = 'n_meta.json'
meta_file_name = 'meta.json'

mode_read = 'r'
mode_write = 'w+'

source_dirs = []

with open('sources.json', mode_read) as json_file:
    data = json.load(json_file)
    directories = data.get('directories')
    if directories is not None:
        source_dirs = directories
    else:
        print(f'!!! Directories not found !!!')

"""
TODO: 
- allow configuring media directories (array of directories)
- function to check for directories without meta.json
    -> include one if not found with the dir name as default name
- allow updating tags
"""


def is_meta(file_name: str) -> bool:
    return file_name == meta_file_name


def is_temp_meta(file_name: str) -> bool:
    return file_name == temp_meta_file_name


def update_meta_added(data: dict, file_path: str):
    print(f'Updating meta for {file_path}')
    data['added'] = True
    json_file = open(file_path, mode_write)
    json_file.write(json.dumps(data, indent=4))
    json_file.close()

def update_meta_file_with_data(data: dict, file_path: str):
    print(f'Updating meta for {file_path}')
    json_file = open(file_path, mode_write)
    json_file.write(json.dumps(data, indent=4))
    json_file.close()


def reset_meta(file_name: str, name: str):
    print(f'Resetting meta for {name} [{file_name}]')

    # Open the file in read mode to load the JSON data
    with open(file_name, 'r') as json_file:
        data = json.load(json_file)  # Load the JSON data

    # Modify the JSON data
    data['added'] = False

    # Open the file in write mode to save the updated data
    with open(file_name, 'w') as json_file:
        json.dump(data, json_file, indent=4)  # Write the updated data

    print(f'{name} reset done')


def arr_lowercase(arr: list[str]):  #list(map(lambda s: s.asJson(), s.seasons)),
    res = list(map(lambda x: str.lower(x), arr))

    return res

def new_uuid() -> str:
    return str(uuid.uuid4())


def save_media_info_for_movie(data, m: Movie):
    m_json = {
        "uuid": new_uuid(),
        "title": data[title_f],
        "type": data[type_f],
        "tags": arr_lowercase(data[tags_f]),
        "imdb": data[imdb_f],
        "folderPath": m.folder_path,
        "path": m.path,
        "created": datetime.now()
    }

    add_media_to_collection(m_json)


def save_media_info_for_series(data, s: Series):
    m_json = {
        "uuid": new_uuid(),
        "title": data[title_f],
        "type": data[type_f],
        "tags": arr_lowercase(data[tags_f]),
        "imdb": data[imdb_f],
        "folderPath": s.folder_path,
        "seasons": list(map(lambda s: s.asJson(), s.seasons)),
        "created": datetime.now()
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


max_suggestions = 3

def search_collections(q: QueryReq, random_suggestions: bool = False):
    m_json = m_json_from_req(q, random_suggestions=random_suggestions)

    res = query_collections(m_json, q.sort, q.sort_direction, page=q.page, page_size=q.page_size)

    if random_suggestions:
        retries = 0
        if len(res) > 0:
            suggestions = []
            while retries < max_suggestions and len(suggestions) < max_suggestions:
               rand_suggestion = random.choice(res)
               if not suggestions.__contains__(rand_suggestion):
                   suggestions.append(rand_suggestion)
               else:
                   retries = retries + 1

            res = suggestions

    json_str = dumps(res, default=str)
    json_res = loads(json_str)

    return json_res


valid_media_file_suffixes = ['.mp4', '.mkv', '.mov', 'avi', '.ts']

def is_media_file(file: str) -> bool:
    is_valid = False
    for suffix in valid_media_file_suffixes:
        if file.endswith(suffix):
            is_valid = True
            break

    #print(f'debug is media file -  file: {file} .. is_vali: {is_valid}')
    return is_valid


def get_existing_movie_files():
    files = existing_movies()
    existing = []
    for file in files:
        existing.append(file[path_f])

    return existing


def get_existing_series():
    res = existing_series()
    all_existing_series = json.loads(dumps(res))
    existing: list[Series] = []
    for series in all_existing_series:
        s = Series(series[uuid_f], series[title_f], series[folder_path_f], series[seasons_f])
        existing.append(s)

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


def is_not_hidden_file(file: str) -> bool:
    return not file.startswith('.')


def add_new_meta_file(folder_name: str, folder_path: str, type: str):
    print(f'Meta not found for {folder_name} - adding temp meta file')
    json_template = {
        title_f: folder_name,
        imdb_f: '<add_url_here>',
        tags_f: [],
        type_f: type,
        'added': False
    }
    file_path = os.path.join(folder_path, temp_meta_file_name)
    with open(file_path, 'w') as f:
        json.dump(json_template, f, indent=4)
    return file_path


def go_through_movies(movies_dir_path: str) -> (int, list[str], int):
    added = 0
    found_movies = []
    movie_folders = os.listdir(movies_dir_path)
    new_meta_files = 0
    for movie_folder in movie_folders:
        if is_not_hidden_file(movie_folder):
            movie_folder_path = os.path.join(movies_dir_path, movie_folder)
            print(f'Movie folder: {movie_folder}')
            (movie, new_added, new_metas) = handle_movie_folder(movie_folder_path, movie_folder)
            found_movies.append(movie)
            added = added + new_added
            new_meta_files = new_meta_files + new_metas

    found_files = list(map(lambda m: m.path, found_movies))

    print(f'Found movie files: {found_files}')
    return added, found_files, new_meta_files


def handle_movie_folder(movie_folder_path: str, movie_folder: str | None = None):
    files = os.listdir(movie_folder_path)
    meta_data = None
    media_file_path = None
    has_been_added = False
    if movie_folder is None:
        movie_folder = os.path.basename(movie_folder_path)
    # media_has_been_removed = False #TODO: use this?
    print(f'Handling path: {movie_folder_path}')
    new_meta_files = 0
    added = 0
    for file in files:
        print(f'File: {file}')
        if is_meta(file):
            meta_file_path = os.path.join(movie_folder_path, file)
            print(f'meta_path: {meta_file_path}')
            (has_been_added, meta_data) = file_has_been_added(meta_file_path)
        elif is_media_file(file):
            if media_file_path is None:
                media_file_path = os.path.join(movie_folder_path, file)
            else:
                print(f'Extra media file found in {movie_folder_path}!')
    movie = Movie(None, movie_folder, movie_folder_path, media_file_path)
    if (not has_been_added) and media_file_path is not None and meta_data is not None:
        save_media_info_for_movie(meta_data, movie)
        update_meta_added(meta_data, meta_file_path)  # TODO: use once fixed
        added = 1
    if meta_data is None:
        add_new_meta_file(movie_folder, movie_folder_path, 'movie')
        new_meta_files = 1

    return movie, added, new_meta_files


def go_through_series(series_dir: str) -> (int, list[Series], int):
    added = 0
    found_series: list[Series] = []
    new_temp_metas = 0
    list_of_series = os.listdir(series_dir)
    for series_name in list_of_series:
        if is_not_hidden_file(series_name):
            series_path = os.path.join(series_dir, series_name)
            print(f'Series: {series_name}')
            (series, new_added, new_metas) = handle_series_folder(series_path, series_name)
            found_series.append(series)
            added = added + new_added
            new_temp_metas = new_temp_metas + new_metas

    found_files = []
    seasons: list[Season] = flatten(list(map(lambda s: s.seasons, found_series)))
    found_files = flatten(list(map(lambda s: s.episodes, seasons)))
    print(f'Found series files: {found_files}')
    return added, found_series, new_temp_metas


def handle_series_folder(series_path: str, series_name: str | None = None):
    season_folders = [
        folder for folder in os.listdir(series_path)
        if not folder.startswith('.')
    ]
    seasons = []
    meta_data = None
    has_been_added = False
    meta_file_path = None
    added = 0
    new_temp_metas = 0
    if series_name is None:
        series_name = os.path.basename(series_path)
    for season_dir in season_folders:
        if is_meta(season_dir):
            meta_file_path = os.path.join(series_path, season_dir)
            (has_been_added, meta_data) = file_has_been_added(meta_file_path)
    for season_dir in season_folders:
        if not is_meta(season_dir) and not is_temp_meta(season_dir):
            print(f'[{series_name}]: SEASON - {season_dir}')
            season_path = os.path.join(series_path, season_dir)
            season_files = os.listdir(season_path)
            media_file_path = None
            season_episodes: list[Episode] = []
            for season_file in season_files:
                print(f'<{season_dir}> File: {season_file}')
                if is_media_file(season_file):
                    media_file_path = os.path.join(season_path, season_file)
                    episode = Episode(season_file, media_file_path)
                    season_episodes.append(episode)
            season = Season(season_dir, season_episodes)
            seasons.append(season)

    series = Series(None, series_name, series_path, seasons)
    if (not has_been_added) and (not meta_data is None):
        save_media_info_for_series(meta_data, series)
        update_meta_added(meta_data, meta_file_path)  # TODO: use once fixed
        added = 1
    if meta_data is None:
        add_new_meta_file(series_name, series_path, 'series')
        new_temp_metas = 1

    return series, added, new_temp_metas


def remove_not_found_movies(found_movie_files: list[str]):
    existing = get_existing_movie_files()
    existing_movies_set = set(existing)
    found_movies_set = set(found_movie_files)
    movie_files_to_be_removed = list(existing_movies_set - found_movies_set)

    print(f'Existing movies: {existing}')
    print(f'Found movies: {found_movie_files}')
    print(f'Should be removed: {movie_files_to_be_removed}')
    removed = remove_medias_by_files(movie_files_to_be_removed)
    return removed


def update_existing_series_with_found(found_series: list[Series]):
    existing_series = get_existing_series()
    series_to_delete: list[Series] = []
    updated = 0
    for e in existing_series:
        #print(f'Existing: ({e.id}) {e.title} ({e.folder_path})')
        matching_series: Series | None = None
        for s in found_series:
            print(f'Found: {s.title} ({s.folder_path})')
            if s.__eq__(e):
                matching_series = s
                break

        #print(f'matching series found: {matching_series is not None}')
        if matching_series is not None:
            m_seasons = matching_series.seasons
            if len(m_seasons) < 1:
                print(f'{matching_series.title} seasons missing - marking to be deleted')
                series_to_delete.append(e)
            elif e.seasons != m_seasons:
                print(f'{matching_series} difference in seasons with found - updating')
                updated = updated + 1
                update_series_seasons(e.uuid, matching_series)

    series_ids_to_delete = list(map(lambda s: s.id, series_to_delete))
    deleted = delete_media_by_ids(series_ids_to_delete)
    return deleted, updated


class MetaFileInfo:
    def __init__(self, is_pending, meta_path: str, data_dict: dict):
        self.is_pending = is_pending
        self.meta_path = meta_path
        self.tags = data_dict[tags_f]
        self.imdb = data_dict[imdb_f]
        self.title = data_dict[title_f]
        self.type = data_dict[type_f]
        self.added = data_dict.get('added')

    def as_json(self):
        res_json = {
            'isPending': self.is_pending,
            type_f: self.type,
            title_f: self.title,
            'metaPath': self.meta_path,
            imdb_f: self.imdb,
            tags_f: self.tags,
            'added': self.added
        }

        return res_json


def list_meta_files():
    meta_file_infos = []
    for source_dir in source_dirs:
        media_type_folders = os.listdir(source_dir)
        for media_folder in media_type_folders:  # series, movies
            if is_not_hidden_file(media_folder) and (media_folder == 'Movies' or media_folder == 'Series'):
                media_type_path = os.path.join(source_dir, media_folder)
                media_type_content_dir = os.listdir(media_type_path)
                for media_content_folder in media_type_content_dir:  #subfolder under series/movies
                    if is_not_hidden_file(media_content_folder):
                        media_content_path = os.path.join(media_type_path, media_content_folder)
                        files = os.listdir(media_content_path)
                        for file in files:
                            is_temp_file = is_temp_meta(file)
                            if is_temp_file or is_meta(file):
                                meta_path = os.path.join(media_content_path, file)
                                data_dict = None
                                with open(meta_path, mode_read) as json_file:
                                    data_dict = json.load(json_file)
                                    json_file.close()
                                print(f'.... meta path: {meta_path}')
                                meta_info = MetaFileInfo(is_temp_file, meta_path, data_dict).as_json()
                                meta_file_infos.append(meta_info)

    return meta_file_infos


def update_meta_file(req_meta_path: str, data_dict: dict):
    cur_file_name = os.path.basename(req_meta_path)
    if os.path.exists(req_meta_path) and (is_meta(cur_file_name) or is_temp_meta(cur_file_name)):
        print(f'Updating {req_meta_path}')
        update_meta_file_with_data(data_dict, req_meta_path)
    else:
        print(f'Meta file not found to update {req_meta_path}')
    return True

def mark_temp_meta_file_ready_for_scanning(temp_absolute_path: str):
    dir = os.path.dirname(temp_absolute_path)
    new_abs_path = os.path.join(dir, meta_file_name)
    cur_file_name = os.path.basename(temp_absolute_path)
    if cur_file_name == temp_meta_file_name and os.path.exists(temp_absolute_path):
        os.rename(temp_absolute_path, new_abs_path)


def go_through_medias():
    added = 0
    removed = 0
    for source_dir in source_dirs:
        media_type_folders = os.listdir(source_dir)
        found_movie_files = []
        series: list[Series] = []
        new_temp_metas = 0
        for media_folder in media_type_folders:  # series, movies
            print(f'Media: {media_folder}')
            media_type_dir = os.path.join(source_dir, media_folder)

            if media_folder == 'Movies':
                print(f'Movies path: {media_type_dir}')
                # TODO: uncomment once series works
                # TODO: NOTE: folderPATH vs PATH
                (added_movies, movie_files, new_movie_meta_files) = go_through_movies(media_type_dir)
                added = added + added_movies
                found_movie_files = movie_files
                new_temp_metas = new_temp_metas + new_movie_meta_files
            elif media_folder == 'Series':
                (added_series, found_series, new_temp_series) = go_through_series(media_type_dir)
                series = found_series
                added = added + added_series
                new_temp_metas = new_temp_metas + new_temp_series
            else:
                print(f'Unsupported media type: {media_folder}')

        (removed_series, updated_series) = update_existing_series_with_found(series)
        removed = remove_not_found_movies(found_movie_files) + removed_series

        return {'added': added, 'updatedSeries': updated_series, 'removed': removed, 'pendingConfig': new_temp_metas}


# ideally should use ID, but the mongodb has had some problems with the ID usage.
# TODO: should refactor the logic later to use ID
def rescan_media_by_uuid(uuid: str):
    """
    fetch media by folder path, delete the media from mongodb, handle by media type and add back to db
    """
    found_items = media_by_uuid(uuid)
    if len(found_items) > 0:
        media_json = json.loads(dumps(found_items[0]))

        title = media_json['title']
        media_type = media_json['type']
        folder_path = media_json['folderPath']
        meta_path = f'{folder_path}/{meta_file_name}'
        reset_meta(meta_path, title)

        remove_media_by_title(title)

        if media_type == 'movie':
            handle_movie_folder(folder_path)
        elif media_type == 'series':
            handle_series_folder(folder_path)
        else:
            print(f'INVALID MEDIA TYPE {media_type}')

        return True
    else:
        print(f'No results found with id: {uuid}')

        return False



#media_res = go_through_medias()
#print(f'..... RES: {media_res}')

#search_collections()

#temp_test_query_making()

def test_series():
    (added, series, new_temp_metas) = go_through_series('/Users/sagu/media_project/media/src/medias/Series')

    series_as_json = list(map(lambda s: s.asJson(), series))
    print(series_as_json)


#TODO: function to reset stuff from DB and allow rescanning from UI
#makes it nicer to e.g. add new fields to the schema and have them usable for all media
def reset_media():
    for source_dir in source_dirs:
        media_type_folders = os.listdir(source_dir)
        for media_type_folder in media_type_folders:
            if media_type_folder == 'Movies' or media_type_folder == 'Series':
                media_type_path = os.path.join(source_dir, media_type_folder)
                media_folders = os.listdir(media_type_path)
                for media_folder in media_folders:
                    if is_not_hidden_file(media_folder):
                        media_folder_path = os.path.join(media_type_path, media_folder)
                        media_folder_files = os.listdir(media_folder_path)
                        for file in media_folder_files:
                            if is_meta(file):
                                meta_file_path = os.path.join(media_folder_path, file)
                                reset_meta(meta_file_path, media_folder)
                                break
        print(f'All meta files reset, Deleting info from DB')
        delete_all_medias()


color_primary_f = 'color_primaries'
color_transfer_f = 'color_transfer'
color_space_f = 'color_space'

possible_color_primaries = ['bt2020']
possible_color_transfers = ['smpte2084', 'arib-std-b67']
possible_color_spces = ['bt2020nc', 'bt2020c']

def media_has_hdr_by_path(path: str):
    if not os.path.exists(path):
        print(f"File does not exist: {path}")
    else:
        try:
            probe = ffmpeg.probe(path)
            video_stream = next((stream for stream in probe['streams'] if stream['codec_type'] == 'video'), None)
            if not video_stream:
                return None

            file_color_primary = video_stream.get(color_primary_f)
            file_color_transfer = video_stream.get(color_transfer_f)
            file_color_space = video_stream.get(color_space_f)

            color_primaries_is_hdr = file_color_primary is not None and possible_color_primaries.__contains__(
                video_stream.get('color_primaries'))
            color_transfer_is_hdr = file_color_transfer is not None and possible_color_transfers.__contains__(
                file_color_transfer)
            color_space_is_hdr = file_color_space is not None and possible_color_spces.__contains__(file_color_space)

            is_most_likely_hdr = color_primaries_is_hdr and color_transfer_is_hdr and color_space_is_hdr

            # print(f'File: {path}')
            # print(f'Is most likely HDR: {is_most_likely_hdr}')

            return is_most_likely_hdr
        except:
            print(f'Something went wrong with trying to fetch HDR info from {path}')
            return False



def media_is_movie(media: dict) -> bool:
    return media.get(type_f) == 'movie'


def movie_media_is_hdr_by_uuid(uuid: str):
    medias = media_by_uuid(uuid)
    movie_medias = list(filter(media_is_movie, medias))

    media_has_hdr = False

    #should be only one
    if len(movie_medias) > 0:
        media = movie_medias[0]
        media_has_hdr = media_has_hdr_by_path(media[path_f])

    return media_has_hdr

#media_has_hdr_by_path('/Users/sagu/media_project/media/src/medias/Movies/Godzilla/godzilla.mp4')
#media_has_hdr_by_path('/Users/sagu/media_project/media/src/medias/Movies/Synecdoche, New York/synecdoche.ts')

#movie_media_is_hdr_by_uuid(['8a5afc53-4dad-429d-8e82-3c6a84c21a58', '4a683e0a-fdf8-4eea-8155-1f944aa8e2e5'])

#test_series()

#rescan_media_by_path('/Users/sagu/media_project/media/src/medias/Series/salkkarit')

#reset_media()
