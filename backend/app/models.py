from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from .database import Base

class Sponsor(Base):
    __tablename__ = "sponsors"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(150), unique=True, nullable=False, index=True)
    contact_name = Column(String(120), nullable=False)
    contact_email = Column(String(150), unique=True, nullable=False)
    tier = Column(String(50), default="Silver")
    pledged_amount = Column(Float, default=0.0)
    status = Column(String(50), default="Prospect")
    notes = Column(Text, default="")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class HackathonTeam(Base):
    __tablename__ = "hackathon_teams"

    id = Column(Integer, primary_key=True, index=True)
    team_name = Column(String(120), unique=True, nullable=False)
    project_track = Column(String(80), nullable=False)
    member_count = Column(Integer, default=4)
    lead_email = Column(String(150), nullable=False)
    university = Column(String(120), default="Toronto Metropolitan University")
    checked_in = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
