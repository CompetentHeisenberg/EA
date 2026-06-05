import re
import time
import pandas as pd

def clean_html(raw_html: str) -> str:
    cleanr = re.compile('<.*?>')
    return re.sub(cleanr, '', raw_html).strip()

def format_time_ago(parsed_time) -> str:
    if not parsed_time:
        return "Recently"
    diff = time.time() - time.mktime(parsed_time)
    if diff < 3600:
        return f"{int(diff // 60)} min ago"
    elif diff < 86400:
        return f"{int(diff // 3600)} hr ago"
    return f"{int(diff // 86400)} d ago"

def format_number(num):
    if pd.isna(num) or num is None:
        return "N/A"
    if num >= 1e12:
        return f"{num / 1e12:.2f}T"
    if num >= 1e9:
        return f"{num / 1e9:.2f}B"
    if num >= 1e6:
        return f"{num / 1e6:.2f}M"
    return str(num)