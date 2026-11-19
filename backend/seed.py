from app.database import Base, engine, SessionLocal
from app.models import Sponsor, HackathonTeam

Base.metadata.create_all(bind=engine)
db = SessionLocal()

if db.query(Sponsor).count() == 0:
    sponsors = [
        Sponsor(company_name="RBC Campus Tech", contact_name="Campus Talent", contact_email="tech-campus@rbc.com", tier="Title", pledged_amount=2500, status="Paid"),
        Sponsor(company_name="Shopify Developer Relations", contact_name="DevRel Team", contact_email="devrel@shopify.com", tier="Gold", pledged_amount=1500, status="Committed"),
        Sponsor(company_name="AMD Markham Engineering", contact_name="University Relations", contact_email="univ@amd.com", tier="Gold", pledged_amount=1500, status="Committed"),
        Sponsor(company_name="Cloudflare Startups", contact_name="Community Partnerships", contact_email="startups@cloudflare.com", tier="Silver", pledged_amount=750, status="Contacted"),
        Sponsor(company_name="MUES Student Union", contact_name="VP Student Life", contact_email="vp.life@mues.ca", tier="Gold", pledged_amount=1200, status="Paid"),
    ]
    db.add_all(sponsors)

if db.query(HackathonTeam).count() == 0:
    teams = [
        HackathonTeam(team_name="ByteBuilders TMU", project_track="AI/ML", member_count=4, lead_email="alex@torontomu.ca"),
        HackathonTeam(team_name="CircuitBreakers", project_track="Hardware", member_count=4, lead_email="priya@torontomu.ca"),
        HackathonTeam(team_name="LedgerFlow", project_track="FinTech", member_count=3, lead_email="marcus@torontomu.ca"),
    ]
    db.add_all(teams)

db.commit()
db.close()
print("Seeded Lunaris Hacks database successfully.")
