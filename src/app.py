from flask import Flask, jsonify, request
from flask_cors import CORS
from queryReq import QueryReq
from mediaHandler import search_collections, go_through_medias, get_existing_tags, reset_media, list_meta_files, \
    update_meta_file, mark_temp_meta_file_ready_for_scanning, rescan_media_by_path
import requests

app = Flask(__name__)
CORS(app)

post = 'POST'
get = 'GET'
put = 'PUT'
delete = 'DELETE'

def invalid_req():
    return "Invalid request", 400

@app.route('/tags', methods = [get])
def tags():
    return jsonify(get_existing_tags())

@app.route('/search-media', methods = [get])
def search():
    titles = request.args.getlist('title')
    tags = request.args.getlist('tag')
    types = request.args.getlist('type')
    sort = request.args.get('sort', type=str)
    sort_direction = request.args.get('sortDirection', type=str)

    query = QueryReq(titles, tags, types, sort, sort_direction)

    return jsonify(search_collections(query))

@app.route('/list-metas', methods=[get])
def list_metas():
    return jsonify(list_meta_files())

@app.route('/update-meta-file', methods=[put])
def update_meta():
    data = request.get_json()
    meta_path_key = 'metaPath'
    meta_path = data['metaPath']
    del data[meta_path_key]

    return jsonify(update_meta_file(meta_path, data))

@app.route('/meta-file-ready-to-scan', methods=[put])
def meta_file_ready_to_scan():
    data = request.get_json()
    temp_path = data['metaPath']
    return jsonify(mark_temp_meta_file_ready_for_scanning(temp_path))

#currently not used from UI and not sure if I should include this
@app.route('/reset-medias', methods=[put])
def reset_medias():
    reset_media()

    return jsonify(True)

@app.route('/preview', methods=[post])
def preview():
    data = request.get_json()
    url = data['url']
    if not url:
        return jsonify({'error': 'URL parameter is missing'}), 400

    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0'
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()

        # Optionally, you can parse the HTML here and extract only the relevant parts (e.g., Open Graph metadata)
        return response.text, response.status_code, {'Content-Type': response.headers['Content-Type']}

    except requests.exceptions.RequestException as e:
        print(f'Error fetching preview for url: {url}')
        return jsonify({'error': str(e)}), 500


@app.route('/update-medias', methods=[post])
def update_media():
    return(jsonify(go_through_medias()))

@app.route('/rescan-media', methods=[put])
def rescan_media():
    folder_path = request.get_json()

    return jsonify(rescan_media_by_path(folder_path))

