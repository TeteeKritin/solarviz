from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app.workers.aggregation_worker import run_daily_aggregation
from app.workers.heartbeat_worker import try_send_heartbeat, flush_outbox

def start_scheduler():
    scheduler = BackgroundScheduler()
    
    # Daily aggregation at midnight
    scheduler.add_job(
        run_daily_aggregation,
        CronTrigger(hour=0, minute=5),
        id="daily_aggregation",
        replace_existing=True
    )
    
    # Heartbeat every 5 minutes
    scheduler.add_job(
        try_send_heartbeat,
        "interval",
        minutes=5,
        id="heartbeat",
        replace_existing=True
    )
    
    # Flush outbox every 10 minutes
    scheduler.add_job(
        flush_outbox,
        "interval",
        minutes=10,
        id="outbox_flush",
        replace_existing=True
    )
    
    scheduler.start()
    return scheduler