from sqlalchemy import Column, String, Boolean, Text
from database import Base

class Voter(Base):
    __tablename__ = "voters"

    voter_id = Column(String, primary_key=True, index=True)
    aadhar_id = Column(String, unique=True, index=True)
    name = Column(String)
    face_encoding = Column(Text)  # Stored as JSON string to persist a list of floats
    has_voted = Column(Boolean, default=False)

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    party = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

class ElectionSettings(Base):
    __tablename__ = "election_settings"

    id = Column(String, primary_key=True, default="current_election")
    title = Column(String, default="Smart Voting System")
    is_active = Column(Boolean, default=True)
    start_date = Column(String, nullable=True) # Optional start ISO date/time
    end_date = Column(String, nullable=True)   # Optional end ISO date/time

