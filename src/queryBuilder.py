import re
from queryReq import QueryReq

and_f = '$and'
regex_f = '$regex'
all_f = '$all'
in_f = '$in'
not_equal_f = '$ne'
not_in_f = '$nin'
skip_f = '$skip'
limit_f = '$limit'

#field names
uuid_f = 'uuid'
title_f = 'title'
created_f = 'created'
folder_path_f = 'folderPath'
type_f = 'type'
tags_f = 'tags'
imdb_f = 'imdb'
path_f = 'path'
seasons_f = 'seasons'


def m_json_from_req(req: QueryReq, random_suggestions: bool = False):
    # Import inside the function to avoid circular imports
    print(f'... random suggestions: {random_suggestions}')

    title_jsons = []

    if random_suggestions:
        title_jsons = [
            {title_f: {not_equal_f: term}}
            for term in req.title_terms
        ]
    else:
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
        and_f: allParams
    }

    print(f'generated query: {combined_query}')

    return combined_query

def medias_to_remove_json(files: list[str]):
    return {
        path_f: {
            in_f: files
        }
    }
