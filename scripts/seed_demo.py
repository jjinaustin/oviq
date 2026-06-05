"""
Seed script — creates a demo organization and sample shipments
with intentional exceptions for local development testing.

Usage:
  cd backend
  python ../scripts/seed_demo.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

from app.db.client import get_supabase
from app.services.exception_detector import ExceptionDetector
from datetime import datetime, timedelta, timezone
import asyncio

db = get_supabase()

def seed():
    print("Seeding demo data...")

    # Organization
    org = db.table("organizations").insert({
        "name": "Demo Freight Co",
        "slug": "demo-freight"
    }).execute().data[0]
    org_id = org["id"]
    print(f"  + Organization: {org_id}")

    now = datetime.now(timezone.utc)
    shipments = [
        {
            "organization_id": org_id,
            "load_id": "LOAD-1001",
            "customer_name": "Acme Corp",
            "customer_email": "ops@acmecorp.com",
            "carrier_name": "FastFreight LLC",
            "carrier_email": "dispatch@fastfreight.com",
            "origin": "Chicago, IL",
            "destination": "Detroit, MI",
            "pickup_scheduled": (now - timedelta(hours=5)).isoformat(),
            "delivery_scheduled": (now + timedelta(hours=3)).isoformat(),
            "status": "pending",
        },
        {
            "organization_id": org_id,
            "load_id": "LOAD-1002",
            "customer_name": "BuildRight Inc",
            "customer_email": "logistics@buildright.com",
            "carrier_name": "CrossCountry Transport",
            "carrier_email": "ops@crosscountry.com",
            "origin": "Dallas, TX",
            "destination": "Houston, TX",
            "pickup_scheduled": (now - timedelta(days=2)).isoformat(),
            "delivery_scheduled": (now - timedelta(hours=6)).isoformat(),
            "status": "in_transit",
        },
        {
            "organization_id": org_id,
            "load_id": "LOAD-1003",
            "customer_name": "Metro Wholesale",
            "carrier_name": "Reliable Carriers",
            "origin": "Atlanta, GA",
            "destination": "Miami, FL",
            "pickup_scheduled": (now - timedelta(days=1)).isoformat(),
            "delivery_scheduled": (now - timedelta(hours=2)).isoformat(),
            "status": "delayed",
        },
        {
            "organization_id": org_id,
            "load_id": "LOAD-1004",
            "customer_name": "Pacific Goods",
            "carrier_name": "West Coast Haulers",
            "origin": "Seattle, WA",
            "destination": "Portland, OR",
            "pickup_scheduled": (now + timedelta(hours=4)).isoformat(),
            "delivery_scheduled": (now + timedelta(hours=10)).isoformat(),
            "status": "pending",
        },
        {
            "organization_id": org_id,
            "load_id": "LOAD-1005",
            "customer_name": "Northeast Distribution",
            "carrier_name": "Allied Freight",
            "origin": "Boston, MA",
            "destination": "New York, NY",
            "pickup_scheduled": (now - timedelta(days=3)).isoformat(),
            "delivery_scheduled": (now - timedelta(days=1)).isoformat(),
            "status": "delivered",
        },
    ]

    detector = ExceptionDetector()
    for s in shipments:
        result = db.table("shipments").insert(s).execute().data[0]
        cases = asyncio.run(detector.evaluate(result))
        tag = f"→ {len(cases)} case(s)" if cases else "→ no exceptions"
        print(f"  + {s['load_id']} ({s['status']}) {tag}")

    print("\nDone. Run backend + frontend to see demo data.")

if __name__ == "__main__":
    seed()
