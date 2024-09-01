from flask import Flask, jsonify, request
from flask_cors import CORS
from queryReq import QueryReq
from mediaHandler import search_collections

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
    titles = request.args.getlist('title')
    tags = request.args.getlist('tag')
    types = request.args.getlist('type')

    query = QueryReq(titles, tags, types)

    return jsonify(search_collections(query))
