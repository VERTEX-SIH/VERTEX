import logging
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from services.classifier import classify_and_store
from services.persistence_service import calculate_persistent_sources

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()

async def scheduled_classify_job():
    logger.info("Starting scheduled classification job...")
    try:
        await classify_and_store(country="IND", days=1)
        await calculate_persistent_sources()
        logger.info("Scheduled classification job completed successfully.")
    except Exception as e:
        logger.error(f"Error in scheduled classification job: {e}")

def setup_scheduler():
    scheduler.add_job(scheduled_classify_job, "interval", minutes=30, id="classify_job", replace_existing=True, coalesce=True, max_instances=1, next_run_time=datetime.now())
    logger.info("Scheduler configured.")

def start_scheduler():
    setup_scheduler()
    scheduler.start()
    logger.info("Scheduler started.")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
    logger.info("Scheduler stopped.")
