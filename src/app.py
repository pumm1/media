from flask import Flask, jsonify, request
from flask_cors import CORS
from queryReq import QueryReq
from mediaHandler import search_collections, go_through_medias
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

@app.route('/search-media', methods = [get])
def search():
    if request.method == get:
        titles = request.args.getlist('title')
        tags = request.args.getlist('tag')
        types = request.args.getlist('type')

        query = QueryReq(titles, tags, types)

        return jsonify(search_collections(query))
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
            return jsonify({'error': str(e)}), 500
    else:
        return invalid_req()


@app.route('/update-medias', methods = [post])
def update_media():
    if request.method == post:
        return(jsonify(go_through_medias()))
    else:
        return invalid_req()