import re
from queryReq import QueryReq

and_f = '$and'
regex_f = '$regex'
all_f = '$all'
in_f = '$in'

#field names
id_f = '_id'
title_f = 'title'
type_f = 'type'
tags_f = 'tags'
imdb_f = 'imdb'
path_f = 'path'


def m_json_from_req(req: QueryReq):
    # Import inside the function to avoid circular imports

    title_jsons = list(
        map(lambda term: {
            title_f: {
                regex_f: re.compile(term, re.IGNORECASE)
            }
        }, req.title_terms)  # Accessing title_terms as an attribute of QueryReq
    )

    tag_jsons = [{
        tags_f: {
            in_f: req.tags
        }
    }]

    type_jsons = [{
        type_f: {
            in_f: req.types
        }

    }]

    allParams: list = title_jsons + tag_jsons + type_jsons

    combined_query = {
        and_f: allParams,
    }

    print(f'generated query: {combined_query}')

    return combined_query

def medias_to_remove_json(files: list[str]):
    return {
        path_f: {
            in_f: files
        }
    }
