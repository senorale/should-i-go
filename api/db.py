import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

engine = create_engine(os.environ["DATABASE_URL"])


def find_majors_with_occupations(query: str) -> list[dict]:
    """Search majors by name and return each match with all linked occupations, salaries, and relevance."""
    with engine.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT m.id AS major_id,
                       m.name AS major,
                       o.name AS occupation,
                       o.annual_salary,
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
        grouped[major]["occupations"].append({
            "occupation": row["occupation"],
            "annual_salary": float(row["annual_salary"]),
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
