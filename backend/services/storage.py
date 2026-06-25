from pathlib import Path
from core.config import FILES_DIR


class Storage:

    def __init__(self, root: Path | str):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def full_path(self, filepath: str) -> Path:
        return self.root / filepath

    def save(self, filepath: str, content: bytes):
        path = self.full_path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)

    def read(self, filepath: str) -> bytes:
        return self.full_path(filepath).read_bytes()

    def delete(self, filepath: str):
        path = self.full_path(filepath)
        if path.exists():
            path.unlink()


storage = Storage(FILES_DIR / "uploads")
