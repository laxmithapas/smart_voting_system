from pydantic import BaseModel
from typing import List, Optional

class RegisterRequest(BaseModel):
    voter_id: str
    aadhar_id: str
    name: str
    image: str

class AuthRequest(BaseModel):
    voter_id: str
    aadhar_id: str
    image: str

class VoteCasting(BaseModel):
    voter_id: str
    candidate_id: str

class BlockchainResponse(BaseModel):
    chain: List[dict]
    length: int

class CandidateCreate(BaseModel):
    name: str
    party: str

class CandidateResponse(BaseModel):
    id: str
    name: str
    party: str
    is_active: bool

    class Config:
        from_attributes = True

class CandidateUpdate(BaseModel):
    name: str
    party: str
    is_active: bool


class ElectionSettingsUpdate(BaseModel):
    title: str
    is_active: bool
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    results_released: Optional[bool] = False

class AdminLoginRequest(BaseModel):
    username: str
    password: str


