from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    # Allow login using local or non-routable email addresses
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user_id: int
    email: str
    role: str