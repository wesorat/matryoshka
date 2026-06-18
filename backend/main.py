import uvicorn
from fastapi import FastAPI

from api.v1.users import user_router


def create_app() -> FastAPI:
    app = FastAPI()
    include_router(app)

    return app


def include_router(app):
    app.include_router(user_router)


if __name__ == "__main__":
    app = create_app()
    uvicorn.run(app, host="0.0.0.0", port=8000)
