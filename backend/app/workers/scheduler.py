from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app.workers.aggregation_worker import run_daily_aggregation
from app.workers.heartbeat_worker import try_send_heartbeat, flush_outbox
from app.workers.pzem_worker import read_and_save

def start_scheduler():
    scheduler = BackgroundScheduler()

    scheduler.add_job(
        read_and_save,
        "interval",
        seconds=60,
        id="pzem_reader",
        name="PZEM Energy Reader",
    )
    scheduler.add_job(
        run_daily_aggregation,
        CronTrigger(hour=0, minute=5),
        id="daily_aggregation",
        replace_existing=True
    )
    scheduler.add_job(
        try_send_heartbeat,
        "interval", minutes=5,
        id="heartbeat",
        replace_existing=True
    )
    scheduler.add_job(
        flush_outbox,
        "interval", minutes=10,
        id="outbox_flush",
        replace_existing=True
    )

    scheduler.start()
    return scheduler