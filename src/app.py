from flask import Flask, jsonify, request
from flask_cors import CORS
from queryReq import QueryReq
from mediaHandler import search_collections, go_through_medias, get_existing_tags, reset_media, list_meta_files, \
    update_meta_file
import requests

app = Flask(__name__)
CORS(app)

post = 'POST'
get = 'GET'
put = 'PUT'
delete = 'DELETE'

def invalid_req():
    return "Invalid request", 400

@app.route('/test')
def hello():
    return 'Ready to watch some videos!'

@app.route('/tags', methods = [get])
def tags():
    if request.method == get:
        return jsonify(get_existing_tags())
    else:
        return invalid_req()

@app.route('/search-media', methods = [get])
def search():
    if request.method == get:
        titles = request.args.getlist('title')
        tags = request.args.getlist('tag')
        types = request.args.getlist('type')
        sort = request.args.get('sort', type=str)
        sort_direction = request.args.get('sortDirection', type=str)

        query = QueryReq(titles, tags, types, sort, sort_direction)

        return jsonify(search_collections(query))
    else:
        return invalid_req()

@app.route('/list-metas', methods=[get])
def list_metas():
    if request.method == get:
        return jsonify(list_meta_files())
    else:
        return invalid_req()

@app.route('/update-meta-file', methods=[put])
def update_meta():
    if request.method == put:
        data = request.get_json()
        meta_path_key = 'metaPath'
        meta_path = data['metaPath']
        del data[meta_path_key]

        return jsonify(update_meta_file(meta_path, data))
    else:
        return invalid_req()

#currently not used from UI and not sure if I should include this
@app.route('/reset-medias', methods=[put])
def reset_medias():
    if request.method == put:
        reset_media()

        return True
    else:
        return invalid_req()

@app.route('/preview', methods=[post])
def preview():
    if request.method == post:
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
    else:
        return invalid_req()


@app.route('/update-medias', methods = [post])
def update_media():
    if request.method == post:
        return(jsonify(go_through_medias()))
    else:
        return invalid_req()
