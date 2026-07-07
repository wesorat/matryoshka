from pathlib import Path
from core.config import FILES_DIR, settings


class Storage:

    def __init__(self, root: Path | str):
        self.root = Path(root).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def full_path(self, filepath: str) -> Path:
        candidate = (self.root / filepath).resolve()
        if candidate != self.root and self.root not in candidate.parents:
            raise ValueError(f"Invalid file path: {filepath}")
        return candidate

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


storage = Storage(settings.UPLOAD_DIR or FILES_DIR / "uploads")
