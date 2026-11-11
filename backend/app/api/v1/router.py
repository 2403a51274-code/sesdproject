from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.urls import router as urls_router
from app.api.v1.analytics import router as analytics_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(urls_router, prefix="/urls", tags=["URLs"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
