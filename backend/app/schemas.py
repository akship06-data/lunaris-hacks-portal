from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class SponsorCreate(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=150)
    contact_name: str
    contact_email: str
    tier: str = "Silver"
    pledged_amount: float = Field(default=0.0, ge=0)
    status: str = "Prospect"
    notes: Optional[str] = ""

class SponsorStatusUpdate(BaseModel):
    status: str
    pledged_amount: Optional[float] = None

class SponsorOut(SponsorCreate):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True

class TeamCreate(BaseModel):
    team_name: str = Field(..., min_length=2, max_length=120)
    project_track: str
    member_count: int = Field(default=4, ge=1, le=4)
    lead_email: str
    university: str = "Toronto Metropolitan University"

class TeamOut(TeamCreate):
    id: int
    checked_in: int
    created_at: datetime

    class Config:
        from_attributes = True
