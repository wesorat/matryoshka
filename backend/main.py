import uvicorn
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.v1.routers import include_routers


def create_app() -> FastAPI:
    app = FastAPI()

    @app.get("/health", tags=["health"])
    @app.get("/api/health", tags=["health"])
    async def health():
        return {"status": "ok"}

    include_routers(app)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return app


if __name__ == "__main__":
    app = create_app()
    uvicorn.run(app, host="0.0.0.0", port=8000)
