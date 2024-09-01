class QueryReq:
    def __init__(self, title_terms: list[str], tags: list[str], types: list[str]):
        self.title_terms = title_terms
        self.tags = tags
        self.types = types
