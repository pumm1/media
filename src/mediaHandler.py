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


class Movie:
    def __init__(self, title: str, folder_path: str, path: str):
        self.title = title
        self.folder_path = folder_path
        self.path = path

class Episode:
    def __init__(self, name: str, path: str):
        self.name = name
        self.path = path

    def asJson(self):
        return {
            "name": self.name,
            "path": self.path

        }


class Season:
    def __init__(self, name: str, episodes: list[Episode]):
        self.name = name
        self.episodes = episodes

    def asJson(self):
        return {
            "name": self.name,
            "episodes": list(map(lambda e: e.asJson(), self.episodes))
        }


class Series:
    def __init__(self, title: str, folder_path: str, seasons: list[Season]):
        self.title = title
        self.folder_path = folder_path
        self.seasons = seasons

    def asJson(self):
        return {
            "title": self.title,
            "seasons": list(map(lambda s: s.asJson(), self.seasons))
        }

def is_meta(file_name: str) -> bool:
    return file_name == 'meta.json'


def update_meta(data: dict, file_name):
    print(f'Updating meta for {file_name}')
    data['added'] = True
    json_file = open(file_name, mode_write)
    json_file.write(json.dumps(data))
    json_file.close()


def save_media_info_for_movie(data, m: Movie):
    m_json = {
        "title": data[title_f],
        "type": data[type_f],
        "tags": data[tags_f],
        "imdb": data[imdb_f],
        "folderPath": m.folder_path,
        "path": m.path
    }

    add_media_to_collection(m_json)

def save_media_info_for_series(data, s: Series):
    m_json = {
        "title": data[title_f],
        "type": data[type_f],
        "tags": data[tags_f],
        "imdb": data[imdb_f],
        "folderPath": s.folder_path,
        "seasons": list(map(lambda s: s.asJson(), s.seasons))
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


def go_through_movies(movies_dir: str) -> (int, list[Movie]):
    added = 0
    found_movies = []
    movie_folders = os.listdir(movies_dir)
    for movie_folder in movie_folders:
        movie_folder_path = os.path.join(movies_dir, movie_folder)
        print(f'Movie folder: {movie_folder}')
        files = os.listdir(movie_folder_path)
        meta_data = None
        media_file_path = None
        has_been_added = False
        #media_has_been_removed = False #TODO: use this?
        for file in files:
            print(f'[{movie_folder}] File: {file}')
            if is_meta(file):
                meta_file_path = os.path.join(movie_folder_path, file)
                print(f'meta_path: {meta_file_path}')
                (has_been_added, meta_data) = file_has_been_added(meta_file_path)
            # TODO: make sure it's media file (mkv, mp4, mov)
            elif is_media_file(file):
                if media_file_path is None:
                    media_file_path = os.path.join(movie_folder_path, file)
                else:
                    print(f'Extra media file found in {movie_folder_path}!')
        if (not has_been_added) and media_file_path is not None:
            movie = Movie(movie_folder, movie_folder_path, media_file_path)
            found_movies.append(movie)
            save_media_info_for_movie(meta_data, movie)
            update_meta(meta_data, meta_file_path)  #TODO: use once fixed
            added = added + 1

    found_files = list(map(lambda m: m.path, found_movies))

    print(f'Found movie files: {found_files}')
    return added, found_movies


"""
own collection for series?
Series <simpsons>
|_ Season <season1>
   |_episode 1
   |_episode 2
   |_...
   |_episode N
   |_meta.json

1. find meta
2. go through medias
3. name: series - season N
"""


#TODO: fix and think logic through..
def go_through_series(series_dir: str):
    added = 0
    found_series: list[Series] = []
    list_of_series = os.listdir(series_dir)
    for series_name in list_of_series:
        series_path = os.path.join(series_dir, series_name)
        print(f'Series: {series_name}')
        season_folders = os.listdir(series_path)
        seasons = []
        meta_data = None
        has_been_added = False
        meta_file_path = None
        for season_dir in season_folders:
            if is_meta(season_dir):
                meta_file_path = os.path.join(series_path, season_dir)
                (has_been_added, meta_data) = file_has_been_added(meta_file_path)
        for season_dir in season_folders:
            if not is_meta(season_dir):
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

        if (not has_been_added) and (not meta_data is None):
            series = Series(series_name, series_path, seasons)
            found_series.append(series)
            save_media_info_for_series(meta_data, series)
            update_meta(meta_data, meta_file_path)  # TODO: use once fixed
            added = added + 1

    found_files = []
    seasons: list[Season] = flatten(list(map(lambda s: s.seasons, found_series)))
    found_files = flatten(list(map(lambda s: s.episodes, seasons)))
    print(f'Found series files: {found_files}')
    return added, found_series


#TODO: how to handle shows
def go_through_medias():
    added = 0
    removed = 0
    media_type_folders = os.listdir(medias_dir)
    existing = get_existing_titles()
    found_files = []
    for media_folder in media_type_folders:  #series, movies
        print(f'Media: {media_folder}')
        media_type_dir = os.path.join(medias_dir, media_folder)

        if media_folder == 'Movies':
            print(f'Movies path: {media_type_dir}')
            #TODO: uncomment once series works
            #TODO: NOTE: folderPATH vs PATH
            (added_movies, movie_files) = go_through_movies(media_type_dir)
            added = added + added_movies
            found_files = found_files + movie_files
        elif media_folder == 'Series':
            (added_series, found_series) = go_through_series(media_type_dir)
            added = added + added_series
        else:
            print(f'Unsupported media type: {media_folder}')

    existing_set = set(existing)
    found_set = set(found_files)

    files_to_be_removed = list(existing_set - found_set)

    print(f'Should be removed: {files_to_be_removed}')
    removed = remove_medias_by_files(files_to_be_removed)

    return {'added': added, 'removed': removed}

#go_through_medias()

#search_collections()

#temp_test_query_making()

def test_series():
    (added, series) = go_through_series('/Users/sagu/media_project/media/src/medias/Series')

    series_as_json = list(map(lambda s: s.asJson(), series))

    print(f'.... found series:')
    print(series_as_json)


test_series()
