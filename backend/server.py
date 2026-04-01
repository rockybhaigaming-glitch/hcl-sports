from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['mongodb+srv://Gopi:EalCpoVlxfCQbsS4@hclsports.nadzus8.mongodb.net/']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['hclsports']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'hcltech-sports-booking-secret-key-2026')
ALGORITHM = "HS256"

ADMIN_EMPLOYEE_IDS = ["ADMIN001", "ADMIN123"]
SPORTS = ["Cricket", "Basketball", "Badminton", "Volleyball"]
TIME_SLOTS = [
    "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
    "19:00", "20:00", "21:00"
]

class LoginRequest(BaseModel):
    employee_id: str
    employee_name: str

class LoginResponse(BaseModel):
    token: str
    employee_id: str
    employee_name: str
    is_admin: bool

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    booking_id: str
    employee_id: str
    employee_name: str
    sport: str
    date: str
    time_slot: str
    status: str = "active"
    created_at: str

class BookingCreate(BaseModel):
    sport: str
    date: str
    time_slot: str

class Slot(BaseModel):
    model_config = ConfigDict(extra="ignore")
    slot_id: str
    sport: str
    date: str
    time_slot: str
    status: str
    released: bool = False

class SlotRelease(BaseModel):
    start_date: str
    end_date: str

class SlotBlock(BaseModel):
    sport: str
    date: str
    time_slot: str

class ReportResponse(BaseModel):
    total_bookings: int
    active_bookings: int
    cancelled_bookings: int
    bookings_by_sport: dict
    bookings_by_date: dict

def create_token(employee_id: str, employee_name: str, is_admin: bool) -> str:
    payload = {
        "employee_id": employee_id,
        "employee_name": employee_name,
        "is_admin": is_admin,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def verify_admin(payload: dict = Depends(verify_token)):
    if not payload.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    if not request.employee_id or not request.employee_name:
        raise HTTPException(status_code=400, detail="Employee ID and Name are required")
    
    is_admin = request.employee_id in ADMIN_EMPLOYEE_IDS
    token = create_token(request.employee_id, request.employee_name, is_admin)
    
    user_doc = {
        "employee_id": request.employee_id,
        "employee_name": request.employee_name,
        "is_admin": is_admin,
        "last_login": datetime.now(timezone.utc).isoformat()
    }
    await db.users.update_one(
        {"employee_id": request.employee_id},
        {"$set": user_doc},
        upsert=True
    )
    
    return LoginResponse(
        token=token,
        employee_id=request.employee_id,
        employee_name=request.employee_name,
        is_admin=is_admin
    )

@api_router.get("/sports")
async def get_sports():
    return {"sports": SPORTS}

@api_router.get("/slots")
async def get_slots(sport: str, date: str, user: dict = Depends(verify_token)):
    slots_data = []
    
    for time_slot in TIME_SLOTS:
        slot_doc = await db.slots.find_one(
            {"sport": sport, "date": date, "time_slot": time_slot},
            {"_id": 0}
        )
        
        if not slot_doc:
            slots_data.append({
                "time_slot": time_slot,
                "status": "locked",
                "released": False
            })
            continue
        
        if slot_doc.get("status") == "blocked":
            slots_data.append({
                "time_slot": time_slot,
                "status": "blocked",
                "released": slot_doc.get("released", False)
            })
            continue
        
        if not slot_doc.get("released", False):
            slots_data.append({
                "time_slot": time_slot,
                "status": "locked",
                "released": False
            })
            continue
        
        booking = await db.bookings.find_one(
            {"sport": sport, "date": date, "time_slot": time_slot, "status": "active"},
            {"_id": 0}
        )
        
        if booking:
            slots_data.append({
                "time_slot": time_slot,
                "status": "booked",
                "released": True,
                "booked_by": booking.get("employee_name")
            })
        else:
            slots_data.append({
                "time_slot": time_slot,
                "status": "available",
                "released": True
            })
    
    return {"slots": slots_data}

@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_req: BookingCreate, user: dict = Depends(verify_token)):
    bookings_today = await db.bookings.count_documents({
        "employee_id": user["employee_id"],
        "date": booking_req.date,
        "status": "active"
    })
    
    if bookings_today >= 2:
        raise HTTPException(status_code=400, detail="Maximum 2 bookings per day allowed")
    
    slot_doc = await db.slots.find_one({
        "sport": booking_req.sport,
        "date": booking_req.date,
        "time_slot": booking_req.time_slot
    })
    
    if not slot_doc or not slot_doc.get("released", False):
        raise HTTPException(status_code=400, detail="Slot not released yet")
    
    if slot_doc.get("status") == "blocked":
        raise HTTPException(status_code=400, detail="Slot is blocked for maintenance")
    
    existing_booking = await db.bookings.find_one({
        "sport": booking_req.sport,
        "date": booking_req.date,
        "time_slot": booking_req.time_slot,
        "status": "active"
    })
    
    if existing_booking:
        raise HTTPException(status_code=400, detail="Slot already booked")
    
    booking_id = f"BK{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}{user['employee_id'][-4:]}"
    
    booking_doc = {
        "booking_id": booking_id,
        "employee_id": user["employee_id"],
        "employee_name": user["employee_name"],
        "sport": booking_req.sport,
        "date": booking_req.date,
        "time_slot": booking_req.time_slot,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bookings.insert_one(booking_doc)
    
    return Booking(**booking_doc)

@api_router.get("/bookings/my", response_model=List[Booking])
async def get_my_bookings(user: dict = Depends(verify_token)):
    bookings = await db.bookings.find(
        {"employee_id": user["employee_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return bookings

@api_router.delete("/bookings/{booking_id}")
async def cancel_booking(booking_id: str, user: dict = Depends(verify_token)):
    booking = await db.bookings.find_one({"booking_id": booking_id})
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["employee_id"] != user["employee_id"]:
        raise HTTPException(status_code=403, detail="Cannot cancel other user's booking")
    
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Booking cancelled successfully"}

@api_router.post("/admin/slots/release")
async def release_slots(release_req: SlotRelease, admin: dict = Depends(verify_admin)):
    start_date = datetime.fromisoformat(release_req.start_date)
    end_date = datetime.fromisoformat(release_req.end_date)
    
    current_date = start_date
    slots_created = 0
    
    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        
        for sport in SPORTS:
            for time_slot in TIME_SLOTS:
                slot_id = f"{sport}_{date_str}_{time_slot}".replace(":", "")
                
                slot_doc = {
                    "slot_id": slot_id,
                    "sport": sport,
                    "date": date_str,
                    "time_slot": time_slot,
                    "status": "available",
                    "released": True,
                    "released_at": datetime.now(timezone.utc).isoformat(),
                    "released_by": admin["employee_id"]
                }
                
                await db.slots.update_one(
                    {"slot_id": slot_id},
                    {"$set": slot_doc},
                    upsert=True
                )
                slots_created += 1
        
        current_date += timedelta(days=1)
    
    return {"message": f"Released {slots_created} slots successfully"}

@api_router.get("/admin/bookings", response_model=List[Booking])
async def get_all_bookings(admin: dict = Depends(verify_admin)):
    bookings = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return bookings

@api_router.delete("/admin/bookings/{booking_id}")
async def admin_cancel_booking(booking_id: str, admin: dict = Depends(verify_admin)):
    result = await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": datetime.now(timezone.utc).isoformat(),
            "cancelled_by": admin["employee_id"]
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {"message": "Booking cancelled successfully"}

@api_router.post("/admin/slots/block")
async def block_slot(block_req: SlotBlock, admin: dict = Depends(verify_admin)):
    slot_id = f"{block_req.sport}_{block_req.date}_{block_req.time_slot}".replace(":", "")
    
    await db.slots.update_one(
        {"slot_id": slot_id},
        {"$set": {
            "status": "blocked",
            "blocked_at": datetime.now(timezone.utc).isoformat(),
            "blocked_by": admin["employee_id"]
        }},
        upsert=True
    )
    
    return {"message": "Slot blocked successfully"}

@api_router.get("/admin/reports", response_model=ReportResponse)
async def get_reports(admin: dict = Depends(verify_admin)):
    all_bookings = await db.bookings.find({}, {"_id": 0}).to_list(10000)
    
    total_bookings = len(all_bookings)
    active_bookings = len([b for b in all_bookings if b["status"] == "active"])
    cancelled_bookings = len([b for b in all_bookings if b["status"] == "cancelled"])
    
    bookings_by_sport = {}
    for sport in SPORTS:
        bookings_by_sport[sport] = len([b for b in all_bookings if b["sport"] == sport and b["status"] == "active"])
    
    bookings_by_date = {}
    for booking in all_bookings:
        if booking["status"] == "active":
            date = booking["date"]
            bookings_by_date[date] = bookings_by_date.get(date, 0) + 1
    
    return ReportResponse(
        total_bookings=total_bookings,
        active_bookings=active_bookings,
        cancelled_bookings=cancelled_bookings,
        bookings_by_sport=bookings_by_sport,
        bookings_by_date=bookings_by_date
    )

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
