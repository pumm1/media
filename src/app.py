from bs4 import BeautifulSoup
from flask import Flask, jsonify, request
from flask_cors import CORS
from queryReq import QueryReq
from mediaHandler import search_collections, go_through_medias, get_existing_tags, reset_media, list_meta_files, \
    update_meta_file, mark_temp_meta_file_ready_for_scanning, rescan_media_by_uuid, movie_media_is_hdr_by_uuid
import requests
from flask_caching import Cache
from playwright.sync_api import sync_playwright

app = Flask(__name__)
CORS(app)

# Configure Redis for caching
app.config['CACHE_TYPE'] = 'RedisCache'
app.config['CACHE_REDIS_URL'] = 'redis://localhost:6379/0'  # Connect to Redis server
app.config['CACHE_DEFAULT_TIMEOUT'] = 60 * 60 * 24 * 30  # Cache timeout in seconds

cache = Cache(app)

post = 'POST'
get = 'GET'
put = 'PUT'
delete = 'DELETE'

def invalid_req():
    return "Invalid request", 400


def fetch_metadata(url: str, debug: bool = False):
    with sync_playwright() as p:

        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800},
            locale="en-US"
        )
        page = context.new_page()

        page.goto(url)
        # Wait for JS to load content
        page.wait_for_load_state("networkidle")
        content = page.content()

        if debug:
            print(f'... response: {content}')

        # Parse HTML with BeautifulSoup
        soup = BeautifulSoup(content, 'html.parser')

        # Extract metadata
        metadata = {
            'title': soup.find('meta', property='og:title') and soup.find('meta', property='og:title')['content']
                     or soup.find('title').text if soup.find('title') else None,
            'info': soup.find('meta', property='og:description') and
                    soup.find('meta', property='og:description')['content'],
            'description': soup.find('meta', attrs={'name': 'description'}) and
                           soup.find('meta', attrs={'name': 'description'})['content'],
            'image': soup.find('meta', property='og:image') and soup.find('meta', property='og:image')['content'],
        }
        browser.close()

        return metadata

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
    page = request.args.get('page', type=int, default=0)
    page_size = request.args.get('pageSize', type=int, default=16)

    query = QueryReq(titles, tags, types, sort, sort_direction, page=page, page_size=page_size)

    search_res = search_collections(query)

    next_page = None
    if len(search_res) >= page_size:
        next_page = page + 1

    res = {
        'results': search_res,
        'nextPage': next_page
    }

    return jsonify(res)

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

    cached_response = cache.get(url)
    if cached_response:
        print(f"Cache hit for URL: {url}")
        return cached_response

    try:
        # Extract metadata
        metadata = fetch_metadata(url)

        # Optionally, you can parse the HTML here and extract only the relevant parts (e.g., Open Graph metadata)
        cache.set(url, metadata)

        return jsonify(metadata)

    except requests.exceptions.RequestException as e:
        print(f'Error fetching preview for url: {url}')
        return jsonify({'error': str(e)}), 500


@app.route('/update-medias', methods=[post])
def update_media():
    return(jsonify(go_through_medias()))

@app.route('/rescan-media', methods=[put])
def rescan_media():
    uuid = request.get_json()

    return jsonify(rescan_media_by_uuid(uuid))

@app.route('/suggestions', methods = [get])
def suggestions():
    titles = request.args.getlist('title')
    tags = request.args.getlist('tag')
    types = request.args.getlist('type')

    query = QueryReq(titles, tags, types, None, None, 0, 500)

    return jsonify(search_collections(query, random_suggestions=True))

@app.route('/media-has-hdr-by-uuid', methods = [get])
def media_has_hdr_by_uudid():
    uuid = request.args.get('uuid')
    """
     res = cache.get(uuid)
-    if res:
-        print(f"Cache hit for UUID HDR info: {uuid}")
-    else:
-        res = movie_media_is_hdr_by_uuid(uuid)

-        cache.set(uuid, str(res))
    """
    res = movie_media_is_hdr_by_uuid(uuid)

    cache.set(uuid, str(res))

    if res == True:
        return jsonify('HDR')
    else:
        return jsonify(None)


#fetch_metadata()
