from fastapi import HTTPException


class ProjectNotFound(HTTPException):
    def __init__(self, user_id: id):
        super().__init__(status_code=404, detail=f"User with id= {user_id} not found")
        self.user_id = user_id

class NotOwnProject(HTTPException):
    def __init__(self, user_id: int):
        super().__init__(
            status_code=403,
            detail=f"User with id={user_id} is not the owner of this project"
        )
        self.user_id = user_id

class NotCorrectEmail(HTTPException):
    def __init__(self, user_id: int):
        super().__init__(
            status_code=403,
            detail=f"User with id={user_id} has another email"
        )
        self.user_id = user_id
