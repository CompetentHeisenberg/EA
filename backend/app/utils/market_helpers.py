def get_sector(symbol: str) -> str:
    if "-USD" in symbol:
        return "Crypto"
    if symbol in ["AAPL", "MSFT", "NVDA", "GOOGL", "META", "AMZN", "TSLA"]:
        return "Tech"
    if symbol in ["JPM", "BAC"]:
        return "Finance"
    if symbol in ["XOM"]:
        return "Energy"
    if symbol in ["JNJ"]:
        return "Healthcare"
    if symbol in ["WMT"]:
        return "Consumer"
    return "Other"