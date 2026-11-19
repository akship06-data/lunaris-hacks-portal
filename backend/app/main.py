import io
import pandas as pd
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from .database import Base, engine, get_db
from .models import Sponsor, HackathonTeam
from .schemas import SponsorCreate, SponsorOut, SponsorStatusUpdate, TeamCreate, TeamOut

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Lunaris Hacks Portal & Sponsor CRM API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VALID_STATUSES = {"Prospect", "Contacted", "Committed", "Paid"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "lunaris-hacks-portal"}

@app.get("/api/dashboard/metrics")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    total_sponsors = db.query(func.count(Sponsor.id)).scalar() or 0
    committed_funding = (
        db.query(func.sum(Sponsor.pledged_amount))
        .filter(Sponsor.status.in_(["Committed", "Paid"]))
        .scalar()
        or 0.0
    )
    pipeline_funding = db.query(func.sum(Sponsor.pledged_amount)).scalar() or 0.0
    total_teams = db.query(func.count(HackathonTeam.id)).scalar() or 0
    total_hackers = db.query(func.sum(HackathonTeam.member_count)).scalar() or 0

    return {
        "total_sponsors": total_sponsors,
        "committed_funding_cad": round(committed_funding, 2),
        "total_pipeline_cad": round(pipeline_funding, 2),
        "total_teams": total_teams,
        "total_participants": total_hackers,
    }

@app.get("/api/sponsors", response_model=list[SponsorOut])
def list_sponsors(status: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Sponsor)
    if status and status != "All":
        query = query.filter(Sponsor.status == status)
    return query.order_by(Sponsor.pledged_amount.desc()).all()

@app.post("/api/sponsors", response_model=SponsorOut, status_code=201)
def create_sponsor(payload: SponsorCreate, db: Session = Depends(get_db)):
    normalized_name = payload.company_name.strip()
    existing = db.query(Sponsor).filter(func.lower(Sponsor.company_name) == normalized_name.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Sponsor '{normalized_name}' already exists.")

    sponsor = Sponsor(**payload.model_dump())
    sponsor.company_name = normalized_name
    sponsor.contact_email = payload.contact_email.strip().lower()
    db.add(sponsor)
    db.commit()
    db.refresh(sponsor)
    return sponsor

@app.patch("/api/sponsors/{sponsor_id}", response_model=SponsorOut)
def update_sponsor_status(sponsor_id: int, payload: SponsorStatusUpdate, db: Session = Depends(get_db)):
    if payload.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status must be one of {VALID_STATUSES}")

    sponsor = db.query(Sponsor).filter(Sponsor.id == sponsor_id).first()
    if not sponsor:
        raise HTTPException(status_code=404, detail="Sponsor not found")

    sponsor.status = payload.status
    if payload.pledged_amount is not None:
        sponsor.pledged_amount = payload.pledged_amount
    db.commit()
    db.refresh(sponsor)
    return sponsor

@app.post("/api/sponsors/ingest-csv")
async def ingest_sponsor_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")

    content = await file.read()
    df = pd.read_csv(io.BytesIO(content))

    required_cols = {"company_name", "contact_name", "contact_email"}
    missing = required_cols - set(df.columns.str.strip().str.lower())
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing required columns: {sorted(missing)}")

    df.columns = df.columns.str.strip().str.lower()
    df = df.dropna(subset=["company_name", "contact_email"]).copy()
    df["company_name"] = df["company_name"].astype(str).str.strip()
    df["contact_name"] = df["contact_name"].fillna("Partnerships Team").astype(str).str.strip()
    df["contact_email"] = df["contact_email"].astype(str).str.strip().str.lower()
    df["tier"] = df.get("tier", pd.Series(["Silver"] * len(df))).fillna("Silver").astype(str).str.strip()
    df["pledged_amount"] = pd.to_numeric(df.get("pledged_amount", 0.0), errors="coerce").fillna(0.0)
    df["status"] = df.get("status", pd.Series(["Prospect"] * len(df))).fillna("Prospect").astype(str).str.strip()
    df = df.drop_duplicates(subset=["contact_email"], keep="first")

    inserted, skipped = 0, 0
    for _, row in df.iterrows():
        exists = (
            db.query(Sponsor)
            .filter(
                (func.lower(Sponsor.company_name) == row["company_name"].lower())
                | (Sponsor.contact_email == row["contact_email"])
            )
            .first()
        )
        if exists:
            skipped += 1
            continue

        db.add(
            Sponsor(
                company_name=row["company_name"],
                contact_name=row["contact_name"],
                contact_email=row["contact_email"],
                tier=row["tier"],
                pledged_amount=float(row["pledged_amount"]),
                status=row["status"] if row["status"] in VALID_STATUSES else "Prospect",
            )
        )
        inserted += 1

    db.commit()
    return {"inserted": inserted, "duplicates_skipped": skipped, "rows_processed": len(df)}

@app.get("/api/teams", response_model=list[TeamOut])
def list_teams(db: Session = Depends(get_db)):
    return db.query(HackathonTeam).order_by(HackathonTeam.created_at.desc()).all()

@app.post("/api/teams", response_model=TeamOut, status_code=201)
def register_team(payload: TeamCreate, db: Session = Depends(get_db)):
    exists = db.query(HackathonTeam).filter(func.lower(HackathonTeam.team_name) == payload.team_name.strip().lower()).first()
    if exists:
        raise HTTPException(status_code=409, detail="Team name already registered.")

    team = HackathonTeam(**payload.model_dump())
    db.add(team)
    db.commit()
    db.refresh(team)
    return team
