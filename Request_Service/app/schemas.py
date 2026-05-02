
from typing import Optional, List, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class SignUp(BaseModel):
    name: str
    email: EmailStr
    password: str
class SignIn(BaseModel):
    email: EmailStr
    password: str
class ResetPasswordRequest(BaseModel):
    email: EmailStr
class ResetPasswordConfirm(BaseModel):
    email: EmailStr
    token: str
    new_password: str = Field(min_length=6)

class CreateUserProfileRequest(BaseModel):
    email: EmailStr
    phone: str
    full_name: str
class UpdateProfileRequest(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    full_name: str
class ChangeRoleRequest(BaseModel):
    user_id: UUID
    role: str
class SkillCreate(BaseModel):
    name: str
class WorkerProfileIn(BaseModel):
    specialty: str
    skills: Optional[List[str]] = []
class SkillIDs(BaseModel):
    skill_ids: List[int]
class UserFiltersIn(BaseModel):
    role: Optional[str] = None
    search: Optional[str] = None
    page: int = 1
    limit: int = 20

class RequestCreate(BaseModel):
    category: str
    description: str
    address: str
    priority: str
    photos: Optional[List[str]] = []
class GetUserRequestsInput(BaseModel):
    status: Optional[str] = None
    page: int = 1
    page_size: int = 20
class IDRequestInput(BaseModel):
    request_id: UUID
class AddPhotosRequest(BaseModel):
    request_id: UUID
    photo_url: str
class RemovePhotosRequest(BaseModel):
    request_id: UUID
    photo_url: List[str]
class AssignWorkerToRequest(BaseModel):
    request_id: UUID
    worker_id: Optional[UUID] = None
class RequestListInput(BaseModel):
    page: int = 1
    page_size: int = 20
    status: Optional[str] = None
    user_id: Optional[UUID] = None
    worker_id: Optional[UUID] = None
    search: Optional[str] = None
    priority: Optional[str] = None
    is_archived: Optional[bool] = None
