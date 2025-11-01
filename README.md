# CSV Duplicate Finder (Flask + Pandas)

A simple Flask web app to upload a CSV, detect duplicate rows across all columns using Pandas, preview results, and download a CSV containing only the duplicates.

## Features
- Upload CSV files (up to 16 MB by default)
- Detect duplicates across all columns (`DataFrame.duplicated(keep=False)`)  
- Preview original data and duplicates in browser
- Download only-duplicates CSV via a secure tokenized link

## Quickstart
```bash
pip install -r requirements.txt
python app.py
```
Open: http://127.0.0.1:5000/

## Notes
- Temporary duplicate CSVs are stored under `uploads/duplicates_<token>.csv` and are ignored by Git.
- For production, consider session/DB-backed storage and lifecycle cleanup of temp files.

## Tech
- Flask, Pandas, Bootstrap

