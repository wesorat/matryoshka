from fastapi import HTTPException


class ProjectNotFound(HTTPException):
    def __init__(self, user_id: id):
        super().__init__(status_code=404, detail=f"User with id= {user_id} not found")
        self.user_id = user_id
