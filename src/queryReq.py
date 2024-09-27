sort_title = 'title'
sort_added = 'created'

sort_default = 'default'
sort_reverse = 'reverse'

valid_sorts = [sort_added, sort_title]
valid_sort_direction = [sort_default, sort_reverse]
class QueryReq:
    def __init__(self, title_terms: list[str], tags: list[str], types: list[str], sort: str | None, sort_direction: str | None):
        direction = 1
        if sort is not None:
            assert valid_sorts.__contains__(sort), f"Invalid sort: {sort}"
        if sort_direction is not None:
            assert valid_sort_direction.__contains__(sort_direction), f"Invalid sort direction: {sort_direction}"
            if sort_direction == sort_default:
                direction = 1
            elif sort_direction == sort_reverse:
                direction = -1
        self.title_terms = title_terms
        self.tags = tags
        self.types = types
        self.sort = sort
        self.sort_direction = direction
