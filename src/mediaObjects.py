class Movie:
    def __init__(self, id, title: str, folder_path: str, path: str):
        self.id = id
        self.title = title
        self.folder_path = folder_path
        self.path = path

class Episode:
    def __init__(self, name: str, path: str):
        self.name = name
        self.path = path

    def __eq__(self, other):
        return self.name == other['name'] and self.path == other['path']

    def asJson(self):
        return {
            "name": self.name,
            "path": self.path

        }


class Season:
    def __init__(self, name: str, episodes: list[Episode]):
        self.name = name
        self.episodes = episodes

    def __eq__(self, other):
        return self.name == other['name'] and self.episodes == other['episodes']

    def asJson(self):
        return {
            "name": self.name,
            "episodes": list(map(lambda e: e.asJson(), self.episodes))
        }


class Series:
    def __init__(self, id, title: str, folder_path: str, seasons: list[Season]):
        self.id = id
        self.title = title
        self.folder_path = folder_path
        self.seasons = seasons
    def __eq__(self, other):
        return self.id == other.id or self.folder_path == other.folder_path

    def asJson(self):
        return {
            "title": self.title,
            "seasons": list(map(lambda s: s.asJson(), self.seasons))
        }