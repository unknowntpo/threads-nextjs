"""Simple script to check generated data."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.infrastructure.database.connection import get_sync_session

session = get_sync_session()
try:
    users = session.execute("SELECT COUNT(*) FROM users").scalar()
    posts = session.execute("SELECT COUNT(*) FROM posts").scalar()
    interactions = session.execute("SELECT COUNT(*) FROM user_interactions").scalar()

    print(f"Users: {users}")
    print(f"Posts: {posts}")
    print(f"Interactions: {interactions}")

    # Get sample interaction
    result = session.execute("SELECT interaction_type, COUNT(*) FROM user_interactions GROUP BY interaction_type")
    print("\nInteraction breakdown:")
    for row in result:
        print(f"  {row[0]}: {row[1]}")

finally:
    session.close()
