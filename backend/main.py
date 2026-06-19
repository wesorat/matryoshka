import uvicorn
from fastapi import Depends, FastAPI


from api.v1.routers import include_routers


def create_app() -> FastAPI:
    app = FastAPI()
    include_routers(app)

    return app


if __name__ == "__main__":
    app = create_app()
    uvicorn.run(app, host="0.0.0.0", port=8000)
