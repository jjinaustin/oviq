import asyncio
from app.services.playbook_runner import PlaybookRunner

CASE_ID = "cb7472a1-199e-4331-8619-8209227262e3"

async def main():
    runner = PlaybookRunner()
    await runner.run_for_case(CASE_ID)
    print("Done.")

asyncio.run(main())
