from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import json
import re
import uuid
import hashlib
from datetime import datetime, timezone
from typing import Optional
import os

from models.schemas import (
    VoteCasting, BlockchainResponse, RegisterRequest, AuthRequest,
    CandidateCreate, CandidateResponse, ElectionSettingsUpdate, CandidateUpdate,
    AdminLoginRequest
)
from blockchain.chain import Blockchain
from auth.face_engine import verify_face, extract_face_encoding, check_liveness
import uvicorn

# Import database and models
from database import engine, get_db, SessionLocal
from models import db_models

# Create DB tables
db_models.Base.metadata.create_all(bind=engine)


app = FastAPI(title="Smart Voting System API")

# Setup CORS for frontend
cors_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


blockchain = Blockchain()

# Hardcoded candidates for seeding database if empty
CANDIDATES_SEED = [
    {"id": "A", "name": "Alice Smith", "party": "Progressive Party"},
    {"id": "B", "name": "Bob Jones", "party": "Conservative Party"},
    {"id": "C", "name": "Charlie Brown", "party": "Independent"}
]

def seed_database():
    db = SessionLocal()
    try:
        if db.query(db_models.Candidate).count() == 0:
            for c in CANDIDATES_SEED:
                db.add(db_models.Candidate(id=c["id"], name=c["name"], party=c["party"], is_active=True))
            db.commit()
        if db.query(db_models.ElectionSettings).count() == 0:
            db.add(db_models.ElectionSettings(
                id="current_election",
                title="Smart Voting System",
                is_active=True,
                start_date=None,
                end_date=None
            ))
            db.commit()
    finally:
        db.close()

seed_database()

@app.get("/")
def read_root():
    return {"message": "Welcome to the Blockchain Smart Voting API"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


def verify_admin_session(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication credentials (session token) missing.")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format. Must be Bearer <token>")
    token = authorization.split(" ")[1]
    if token != "admin-demo-token-xyz789":
        raise HTTPException(status_code=401, detail="Invalid or expired admin session token.")
    return token


def anonymize_voter_id(voter_id: str) -> str:
    return hashlib.sha256(voter_id.encode("utf-8")).hexdigest()


@app.post("/admin/login")
def admin_login(payload: AdminLoginRequest):
    if payload.username == "admin" and payload.password == "admin123":
        return {"token": "admin-demo-token-xyz789", "token_type": "bearer"}
    else:
        raise HTTPException(status_code=401, detail="Invalid administrator credentials.")


@app.post("/register")
def register_voter(request: RegisterRequest, db: Session = Depends(get_db)):
    # Input validation
    if not re.match(r"^[a-zA-Z0-9]{10}$", request.voter_id):
        raise HTTPException(status_code=400, detail="Voter ID must be a 10-character alphanumeric string.")
        
    if not re.match(r"^\d{12}$", request.aadhar_id):
        raise HTTPException(status_code=400, detail="Aadhar ID must be exactly 12 digits.")
        
    if not re.match(r"^[a-zA-Z\s]{3,50}$", request.name):
        raise HTTPException(status_code=400, detail="Name must be between 3 and 50 characters, containing only letters and spaces.")
        
    # Check election status for registration
    settings = db.query(db_models.ElectionSettings).filter(db_models.ElectionSettings.id == "current_election").first()
    status_info = get_election_status_info(settings)
    if not status_info["is_registration_open"]:
        raise HTTPException(status_code=400, detail=f"Registration is closed. {status_info['status_reason']}")
        
    # Check existing voter ID
    existing_voter = db.query(db_models.Voter).filter(db_models.Voter.voter_id == request.voter_id).first()
    if existing_voter:
        raise HTTPException(status_code=400, detail="Voter ID already registered")

    # Check existing Aadhar ID
    existing_aadhar = db.query(db_models.Voter).filter(db_models.Voter.aadhar_id == request.aadhar_id).first()
    if existing_aadhar:
        raise HTTPException(status_code=400, detail="Aadhar Card Number already registered")
        
    # Check liveness
    liveness_res = check_liveness(request.image)
    if not liveness_res.get("liveness_detected"):
        raise HTTPException(status_code=400, detail=f"Liveness check failed: {liveness_res.get('error', 'Anti-spoofing verification failed')}")
        
    encoding = extract_face_encoding(request.image)
    if not encoding:
        raise HTTPException(status_code=400, detail="No face detected in image. Please retake photo.")
        
    new_voter = db_models.Voter(
        voter_id=request.voter_id,
        aadhar_id=request.aadhar_id,
        name=request.name.strip(),
        face_encoding=json.dumps(encoding),
        has_voted=False
    )
    db.add(new_voter)
    db.commit()
    db.refresh(new_voter)
    
    return {"message": "Voter registered successfully", "voter_id": new_voter.voter_id}

@app.post("/authenticate")
def authenticate_voter(request: AuthRequest, db: Session = Depends(get_db)):
    # Input validation
    if not re.match(r"^[a-zA-Z0-9]{10}$", request.voter_id):
        raise HTTPException(status_code=400, detail="Voter ID must be a 10-character alphanumeric string.")
        
    if not re.match(r"^\d{12}$", request.aadhar_id):
        raise HTTPException(status_code=400, detail="Aadhar ID must be exactly 12 digits.")

    voter = db.query(db_models.Voter).filter(db_models.Voter.voter_id == request.voter_id).first()
    if not voter:
        raise HTTPException(status_code=404, detail="Voter ID not registered in system.")
        
    # Verify Aadhar
    if voter.aadhar_id != request.aadhar_id:
        raise HTTPException(status_code=401, detail="Invalid Aadhar details provided.")
    
    # Check liveness
    liveness_res = check_liveness(request.image)
    if not liveness_res.get("liveness_detected"):
        raise HTTPException(status_code=401, detail=f"Liveness check failed: {liveness_res.get('error', 'Anti-spoofing verification failed')}")

    # Verify Face
    saved_encoding = json.loads(voter.face_encoding)
    is_match = verify_face(saved_encoding, request.image)
    if not is_match:
        raise HTTPException(status_code=401, detail="Face authentication failed. Biometrics do not match.")
        
    return {
        "message": "Authentication successful", 
        "authenticated": True, 
        "voter_name": voter.name, 
        "has_voted": voter.has_voted
    }

def parse_iso_datetime(iso_str):
    if not iso_str:
        return None
    try:
        clean_str = iso_str.strip()
        if clean_str.endswith("Z"):
            clean_str = clean_str.replace("Z", "+00:00")
        parsed = datetime.fromisoformat(clean_str)
        if parsed.tzinfo is not None:
            return parsed.astimezone(timezone.utc).replace(tzinfo=None)
        return parsed
    except Exception:
        return None

def get_election_status_info(settings, now=None):
    if now is None:
        now = datetime.utcnow()
    
    effective_status = "active"
    is_voting_open = True
    is_registration_open = True
    status_reason = "The election is active and voting is open."
    
    if not settings or not settings.is_active:
        effective_status = "inactive"
        is_voting_open = False
        is_registration_open = False
        status_reason = "Voting is closed because the election is inactive."
    else:
        if settings.start_date:
            start_dt = parse_iso_datetime(settings.start_date)
            if start_dt and now < start_dt:
                effective_status = "scheduled"
                is_voting_open = False
                status_reason = f"Voting has not started yet (scheduled to start at {settings.start_date})."
        if settings.end_date:
            end_dt = parse_iso_datetime(settings.end_date)
            if end_dt and now > end_dt:
                effective_status = "closed"
                is_voting_open = False
                is_registration_open = False
                status_reason = f"Voting has ended (closed at {settings.end_date})."
                
    return {
        "effective_status": effective_status,
        "is_voting_open": is_voting_open,
        "is_registration_open": is_registration_open,
        "status_reason": status_reason,
        "server_time": now.isoformat() + "Z"
    }

@app.post("/vote")
def cast_vote(vote_data: VoteCasting, db: Session = Depends(get_db)):
    voter_id = vote_data.voter_id
    candidate_id = vote_data.candidate_id
    
    # Input validation
    if not re.match(r"^[a-zA-Z0-9]{10}$", voter_id):
        raise HTTPException(status_code=400, detail="Invalid Voter ID format.")
        
    # Check election status
    settings = db.query(db_models.ElectionSettings).filter(db_models.ElectionSettings.id == "current_election").first()
    status_info = get_election_status_info(settings)
    if not status_info["is_voting_open"]:
        raise HTTPException(status_code=400, detail=status_info["status_reason"])

    # Verify candidate exists and is active
    candidate = db.query(db_models.Candidate).filter(db_models.Candidate.id == candidate_id).first()
    if not candidate or not candidate.is_active:
        raise HTTPException(status_code=400, detail="Invalid or inactive candidate selected.")

    voter = db.query(db_models.Voter).filter(db_models.Voter.voter_id == voter_id).first()
    if not voter:
        raise HTTPException(status_code=404, detail="Voter not found. Please register.")
        
    if voter.has_voted:
        raise HTTPException(status_code=403, detail="Voter has already cast a vote!")
        
    # Create transaction
    transaction = {
        "voter_id_hash": anonymize_voter_id(voter_id),
        "candidate_id": candidate_id
    }
    
    blockchain.add_new_transaction(transaction)
    # Mine immediately for prototype purposes
    blockchain.mine()
    
    # Mark as voted
    voter.has_voted = True
    db.commit()

    # Calculate transaction hash
    tx_hash = hashlib.sha256(json.dumps(transaction, sort_keys=True).encode("utf-8")).hexdigest()
    
    return {
        "message": "Vote successfully cast and added to blockchain",
        "block_index": blockchain.last_block.index,
        "block_hash": blockchain.last_block.hash,
        "timestamp": datetime.fromtimestamp(blockchain.last_block.timestamp).isoformat(),
        "tx_hash": tx_hash
    }

@app.get("/candidates")
def get_candidates(active_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(db_models.Candidate)
    if active_only:
        query = query.filter(db_models.Candidate.is_active == True)
    candidates = query.all()
    return {"candidates": [{"id": c.id, "name": c.name, "party": c.party, "is_active": c.is_active} for c in candidates]}

@app.get("/chain", response_model=BlockchainResponse)
def get_chain():
    chain_data = []
    for block in blockchain.chain:
        chain_data.append(block.__dict__)
    return {"chain": chain_data, "length": len(chain_data)}

@app.get("/results")
def get_results(db: Session = Depends(get_db)):
    # Tally votes from blockchain
    db_candidates = db.query(db_models.Candidate).all()
    results = {c.id: 0 for c in db_candidates}
    
    for block in blockchain.chain:
        for tx in block.transactions:
            cid = tx.get("candidate_id")
            if cid in results:
                results[cid] += 1
                
    total_votes = sum(results.values())
    total_registered = db.query(db_models.Voter).count()
    turnout_pct = 0.0 if total_registered == 0 else round((total_votes / total_registered) * 100, 2)
                
    return {
        "results": results,
        "total_votes": total_votes,
        "total_registered": total_registered,
        "turnout_percentage": turnout_pct
    }

@app.get("/election")
def get_election(db: Session = Depends(get_db)):
    settings = db.query(db_models.ElectionSettings).filter(db_models.ElectionSettings.id == "current_election").first()
    if not settings:
        settings = db_models.ElectionSettings(
            id="current_election",
            title="Smart Voting System",
            is_active=True,
            start_date=None,
            end_date=None
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    status_info = get_election_status_info(settings)
    return {
        "title": settings.title,
        "is_active": settings.is_active,
        "start_date": settings.start_date,
        "end_date": settings.end_date,
        "effective_status": status_info["effective_status"],
        "is_voting_open": status_info["is_voting_open"],
        "is_registration_open": status_info["is_registration_open"],
        "status_reason": status_info["status_reason"],
        "server_time": status_info["server_time"]
    }

@app.put("/admin/election")
def update_election(payload: ElectionSettingsUpdate, db: Session = Depends(get_db), token: str = Depends(verify_admin_session)):
    settings = db.query(db_models.ElectionSettings).filter(db_models.ElectionSettings.id == "current_election").first()
    if not settings:
        raise HTTPException(status_code=404, detail="Election settings not found.")
    
    start_date = payload.start_date.strip() if payload.start_date else None
    if not start_date:
        start_date = None
    end_date = payload.end_date.strip() if payload.end_date else None
    if not end_date:
        end_date = None
        
    start_dt = None
    end_dt = None
    
    if start_date:
        start_dt = parse_iso_datetime(start_date)
        if not start_dt:
            raise HTTPException(status_code=400, detail=f"Invalid Start Date & Time format: '{payload.start_date}'")
        start_date = start_dt.isoformat()
        
    if end_date:
        end_dt = parse_iso_datetime(end_date)
        if not end_dt:
            raise HTTPException(status_code=400, detail=f"Invalid End Date & Time format: '{payload.end_date}'")
        end_date = end_dt.isoformat()
        
    if start_dt and end_dt:
        if end_dt < start_dt:
            raise HTTPException(status_code=400, detail="End date cannot be earlier than start date.")
            
    settings.title = payload.title
    settings.is_active = payload.is_active
    settings.start_date = start_date
    settings.end_date = end_date
    db.commit()
    db.refresh(settings)
    return {"message": "Election settings updated successfully"}

@app.post("/admin/candidates", response_model=CandidateResponse)
def add_candidate(payload: CandidateCreate, db: Session = Depends(get_db), token: str = Depends(verify_admin_session)):
    if not payload.name.strip() or not payload.party.strip():
        raise HTTPException(status_code=400, detail="Candidate name and party are required.")
    
    existing_count = db.query(db_models.Candidate).count()
    if existing_count < 26:
        new_id = chr(ord('A') + existing_count)
        while db.query(db_models.Candidate).filter(db_models.Candidate.id == new_id).first():
            new_id = uuid.uuid4().hex[:6].upper()
    else:
        new_id = uuid.uuid4().hex[:6].upper()

    new_candidate = db_models.Candidate(
        id=new_id,
        name=payload.name.strip(),
        party=payload.party.strip(),
        is_active=True
    )
    db.add(new_candidate)
    db.commit()
    db.refresh(new_candidate)
    return new_candidate

@app.put("/admin/candidates/{candidate_id}", response_model=CandidateResponse)
def update_candidate(candidate_id: str, payload: CandidateUpdate, db: Session = Depends(get_db), token: str = Depends(verify_admin_session)):
    candidate = db.query(db_models.Candidate).filter(db_models.Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    if not payload.name.strip() or not payload.party.strip():
        raise HTTPException(status_code=400, detail="Candidate name and party are required.")
    candidate.name = payload.name.strip()
    candidate.party = payload.party.strip()
    candidate.is_active = payload.is_active
    db.commit()
    db.refresh(candidate)
    return candidate

@app.delete("/admin/candidates/{candidate_id}")
def delete_candidate(candidate_id: str, db: Session = Depends(get_db), token: str = Depends(verify_admin_session)):
    candidate = db.query(db_models.Candidate).filter(db_models.Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    candidate.is_active = False
    db.commit()
    return {"message": f"Candidate {candidate_id} has been deactivated/disabled."}

@app.get("/admin/voters")
def get_admin_voters(db: Session = Depends(get_db), token: str = Depends(verify_admin_session)):
    voters = db.query(db_models.Voter).all()
    return {
        "voters": [
            {
                "voter_id": v.voter_id,
                "name": v.name,
                "has_voted": v.has_voted
            }
            for v in voters
        ]
    }

@app.get("/voter/status/{voter_id}")
def check_voter_status(voter_id: str, db: Session = Depends(get_db)):
    if not re.match(r"^[a-zA-Z0-9]{10}$", voter_id):
        raise HTTPException(status_code=400, detail="Invalid Voter ID format.")
    
    voter = db.query(db_models.Voter).filter(db_models.Voter.voter_id == voter_id).first()
    if not voter:
        return {
            "registered": False,
            "has_voted": False,
            "name": None,
            "eligible": False,
            "status": "Not Registered"
        }
    
    # Mask name for privacy (e.g. "John Doe" -> "J*** D**")
    name_parts = voter.name.split()
    masked_parts = []
    for part in name_parts:
        if len(part) <= 1:
            masked_parts.append(part)
        elif len(part) == 2:
            masked_parts.append(part[0] + "*")
        else:
            masked_parts.append(part[0] + "*" * (len(part) - 2) + part[-1])
    masked_name = " ".join(masked_parts)

    return {
        "registered": True,
        "has_voted": voter.has_voted,
        "name": masked_name,
        "eligible": not voter.has_voted,
        "status": "Already Voted" if voter.has_voted else "Eligible to Vote",
        "voter_id_hash": anonymize_voter_id(voter_id) if voter.has_voted else None
    }

@app.get("/audit/summary")
def get_audit_summary(db: Session = Depends(get_db)):
    # 1. Basic Stats
    total_registered = db.query(db_models.Voter).count()
    
    # Count votes in blockchain
    total_votes = 0
    for block in blockchain.chain:
        total_votes += len(block.transactions)
        
    turnout_pct = 0.0 if total_registered == 0 else round((total_votes / total_registered) * 100, 2)
    
    # 2. Blockchain Validity Verification
    is_valid = True
    for i in range(1, len(blockchain.chain)):
        current = blockchain.chain[i]
        previous = blockchain.chain[i - 1]
        if current.previous_hash != previous.hash:
            is_valid = False
            break
        if not current.hash.startswith('0' * blockchain.difficulty):
            is_valid = False
            break
        if current.hash != current.compute_hash():
            is_valid = False
            break
            
    # 3. Compile anonymous records
    voted_records = []
    for block in blockchain.chain:
        for tx in block.transactions:
            tx_hash = hashlib.sha256(json.dumps(tx, sort_keys=True).encode("utf-8")).hexdigest()
            voted_records.append({
                "voter_id_hash": tx.get("voter_id_hash"),
                "block_index": block.index,
                "timestamp": datetime.fromtimestamp(block.timestamp).isoformat(),
                "tx_hash": tx_hash
            })
            
    return {
        "total_registered": total_registered,
        "total_votes": total_votes,
        "turnout_percentage": turnout_pct,
        "blockchain_length": len(blockchain.chain),
        "is_chain_valid": is_valid,
        "voted_records": voted_records
    }


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=False)
