import json
from mediaDAO import add_media_to_collection, query_collections, existing_movies, remove_media_by_files, existing_tags, \
    existing_series, update_series_seasons, delete_media_by_ids
import os
from bson import ObjectId
from bson.json_util import dumps, loads
from pandas.core.common import flatten

from queryReq import QueryReq
from queryBuilder import m_json_from_req, title_f, type_f, tags_f, imdb_f, path_f, medias_to_remove_json, folder_path_f, \
    seasons_f, id_f

from mediaObjects import Movie, Series, Season, Episode

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
        id = series[id_f]
        s = Series(id, series[title_f], series[folder_path_f], series[seasons_f])
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


def go_through_movies(movies_dir: str) -> (int, list[str]):
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
        movie = Movie(None, movie_folder, movie_folder_path, media_file_path)
        found_movies.append(movie)
        if (not has_been_added) and media_file_path is not None:
            save_media_info_for_movie(meta_data, movie)
            update_meta(meta_data, meta_file_path)  #TODO: use once fixed
            added = added + 1

    found_files = list(map(lambda m: m.path, found_movies))

    print(f'Found movie files: {found_files}')
    return added, found_files


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

        series = Series(None, series_name, series_path, seasons)
        found_series.append(series)
        if (not has_been_added) and (not meta_data is None):
            save_media_info_for_series(meta_data, series)
            update_meta(meta_data, meta_file_path)  # TODO: use once fixed
            added = added + 1

    found_files = []
    seasons: list[Season] = flatten(list(map(lambda s: s.seasons, found_series)))
    found_files = flatten(list(map(lambda s: s.episodes, seasons)))
    print(f'Found series files: {found_files}')
    return added, found_series


def remove_not_found_movies(found_movie_files: list[str]):
    existing = get_existing_movie_files()
    existing_movies_set = set(existing)
    found_movies_set = set(found_movie_files)
    movie_files_to_be_removed = list(existing_movies_set - found_movies_set)

    print(f'Existing movies: {existing}')
    print(f'Found movies: {found_movie_files}')
    print(f'Should be removed: {movie_files_to_be_removed}')
    #TODO: fix, as files to be removed contains wrong things
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
                update_series_seasons(ObjectId(e.id['$oid']), matching_series)

    series_ids_to_delete = list(map(lambda s: s.id, series_to_delete))
    deleted = delete_media_by_ids(series_ids_to_delete)
    return deleted, updated



def go_through_medias():
    added = 0
    removed = 0
    media_type_folders = os.listdir(medias_dir)
    found_movie_files = []
    series: list[Series] = []
    for media_folder in media_type_folders:  #series, movies
        print(f'Media: {media_folder}')
        media_type_dir = os.path.join(medias_dir, media_folder)

        if media_folder == 'Movies':
            print(f'Movies path: {media_type_dir}')
            #TODO: uncomment once series works
            #TODO: NOTE: folderPATH vs PATH
            (added_movies, movie_files) = go_through_movies(media_type_dir)
            added = added + added_movies
            found_movie_files = movie_files
        elif media_folder == 'Series':
            (added_series, found_series) = go_through_series(media_type_dir)
            series = found_series
            added = added + added_series
        else:
            print(f'Unsupported media type: {media_folder}')

    (removed_series, updated_series) = update_existing_series_with_found(series)
    removed = remove_not_found_movies(found_movie_files) + removed_series

    return {'added': added, 'updatedSeries': updated_series, 'removed': removed}


#TODO: fix series update
media_res = go_through_medias()
print(f'..... RES: {media_res}')

#search_collections()

#temp_test_query_making()

def test_series():
    (added, series) = go_through_series('/Users/sagu/media_project/media/src/medias/Series')

    series_as_json = list(map(lambda s: s.asJson(), series))

    print(f'.... found series:')
    print(series_as_json)


#test_series()
