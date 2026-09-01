import logging
import os

import requests
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

engine = create_engine(os.environ["DATABASE_URL"], pool_pre_ping=True)

ONET_API_KEY = os.environ.get("O_NET_API_KEY", "")
ONET_BASE_URL = "https://api-v2.onetcenter.org"

EDUCATION_CODE_TO_YEARS = {
    1: 0,    # Less than high school
    2: 0,    # High school diploma or equivalent
    3: 0,    # Post-secondary certificate
    4: 1,    # Some college, no degree
    5: 2,    # Associate's degree
    6: 4,    # Bachelor's degree
    7: 4,    # Post-baccalaureate certificate
    8: 6,    # Master's degree
    9: 6,    # Post-master's certificate
    10: 8,   # First professional degree (JD, MD, etc.)
    11: 8,   # Doctoral degree
    12: 10,  # Post-doctoral training
}


def _fetch_typical_years(occupation_code: str) -> float | None:
    """Call O*NET education endpoint, return years for highest-percentage education level."""
    if not ONET_API_KEY:
        return None
    onet_code = occupation_code + ".00"
    url = f"{ONET_BASE_URL}/online/occupations/{onet_code}/summary/education"
    try:
        resp = requests.get(url, headers={
            "X-API-Key": ONET_API_KEY,
            "Accept": "application/json",
            "User-Agent": "should-i-go/1.0",
        }, timeout=10)
        if resp.status_code != 200:
            logger.warning("O*NET returned %d for %s", resp.status_code, onet_code)
            return None
        data = resp.json().get("response", [])
        if not data:
            return None
        has_percentages = any("percentage_of_respondents" in d for d in data)
        if has_percentages:
            top = max(data, key=lambda d: d.get("percentage_of_respondents", 0))
        else:
            top = max(data, key=lambda d: d.get("code", 0))
        return EDUCATION_CODE_TO_YEARS.get(top["code"])
    except Exception:
        logger.exception("O*NET fetch failed for %s", occupation_code)
        return None


def _backfill_years(occupation_code: str) -> float | None:
    """Fetch from O*NET and write to DB. Returns the value or None."""
    years = _fetch_typical_years(occupation_code)
    if years is None:
        return None
    with engine.begin() as conn:
        conn.execute(
            text("""
                UPDATE "OccupationSubCategory"
                SET typical_years_of_school = :years, updated_at = NOW()
                WHERE occupation_code = :code
            """),
            {"years": years, "code": occupation_code},
        )
    return years


def find_majors_with_occupations(query: str) -> list[dict]:
    """Search majors by name and return each match with all linked occupations, salaries, and relevance."""
    with engine.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT m.id AS major_id,
                       m.name AS major,
                       o.name AS occupation,
                       o.occupation_code,
                       o.annual_salary,
                       o.typical_years_of_school,
                       mo.relevance
                FROM "Major" m
                JOIN "MajorOccupation" mo ON mo.major_id = m.id
                JOIN "OccupationSubCategory" o ON o.id = mo.occupation_id
                WHERE m.name ILIKE :q
                ORDER BY m.name, mo.relevance DESC
            """),
            {"q": f"%{query}%"},
        )
        flat = [dict(r._mapping) for r in rows]

    grouped: dict[str, dict] = {}
    for row in flat:
        major = row["major"]
        if major not in grouped:
            grouped[major] = {"major_id": row["major_id"], "major": major, "occupations": []}

        years = row["typical_years_of_school"]
        if years is None:
            years = _backfill_years(row["occupation_code"])

        grouped[major]["occupations"].append({
            "occupation": row["occupation"],
            "annual_salary": float(row["annual_salary"]),
            "typical_years_of_school": float(years) if years is not None else None,
            "relevance": float(row["relevance"]),
        })

    return list(grouped.values())


def get_tuition_medians() -> list[dict]:
    """Get median tuition data by school type."""
    with engine.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT cohort, label, sticker_annual, net_price_annual,
                       cost_of_attendance_annual
                FROM "TuitionMedian"
                ORDER BY cohort
            """)
        )
        return [dict(r._mapping) for r in rows]
