import sqlite3
conn = sqlite3.connect('db.sqlite3')
cur = conn.cursor()
cur.execute("SELECT username, role, is_validated, is_active FROM accounts_user ORDER BY id")
rows = cur.fetchall()
print("username | role | is_validated | is_active")
print("-" * 55)
for r in rows:
    print(r)
conn.close()
