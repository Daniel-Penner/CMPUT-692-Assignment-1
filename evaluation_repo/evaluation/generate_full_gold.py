#!/usr/bin/env python3
import os
import json
import sys

# Default paths (adjust as needed)
DEV_JSONL_PATH = "../sqlite/dev_sqlite_subset.jsonl"   # full dev set
OUTPUT_SQL_PATH = "../sqlite/dev_sqlite_gold.sql"

def extract_sql(entry):
    for key in ["query", "SQL", "sql", "gold", "query_toks"]:
        if key in entry:
            return entry[key]
    raise KeyError(f"No SQL field in entry: {entry.keys()}")

def main():
    input_path = sys.argv[1] if len(sys.argv) > 1 else DEV_JSONL_PATH
    output_path = sys.argv[2] if len(sys.argv) > 2 else OUTPUT_SQL_PATH

    with open(input_path, "r", encoding="utf-8") as f:
        data = [json.loads(line) for line in f]

    with open(output_path, "w", encoding="utf-8") as out:
        for item in data:
            try:
                sql = extract_sql(item).strip()
                db_id = item["db_id"]
            except Exception as e:
                print(f"⚠️ Skipping: {e}")
                continue
            out.write(f"{sql}\t{db_id}\n")

    print(f"✅ Gold file written to {output_path} with {len(data)} queries.")

if __name__ == "__main__":
    main()
