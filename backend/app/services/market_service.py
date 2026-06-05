import yfinance as yf
from fastapi import HTTPException
from app.constants.finance import TICKERS, STOCK_SYMBOLS, INDEX_SYMBOLS
from app.utils.formatters import format_number
from app.utils.market_helpers import get_sector

async def fetch_financial_summary():
    try:
        result = []
        for label, symbol in TICKERS.items():
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period="2d")
            if len(hist) >= 2:
                prev_close = hist["Close"].iloc[-2]
                last_close = hist["Close"].iloc[-1]
                change = ((last_close - prev_close) / prev_close) * 100
                sign = "+" if change >= 0 else ""
                result.append({
                    "label": label,
                    "value": f"{last_close:,.2f} ({sign}{change:.2f}%)"
                })
            elif len(hist) == 1:
                last_close = hist["Close"].iloc[-1]
                result.append({
                    "label": label,
                    "value": f"{last_close:,.2f}"
                })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def fetch_trending_data():
    try:
        stock_symbols = ["NVDA", "TSLA", "AAPL", "MSFT", "META", "AMZN", "GOOGL", "AMD", "INTC"]
        crypto_symbols = ["BTC-USD", "ETH-USD"]
        all_symbols = stock_symbols + crypto_symbols

        data = yf.download(" ".join(all_symbols), period="1d", interval="15m", progress=False)

        results = []
        for sym in all_symbols:
            close_series = data['Close'][sym].dropna()

            if len(close_series) >= 2:
                first_price = float(close_series.iloc[0])
                last_price = float(close_series.iloc[-1])
                change_pct = ((last_price - first_price) / first_price) * 100
                
                prices = close_series.tail(20).tolist()
                name = sym.replace("-USD", "")
                
                results.append({
                    "symbol": name,
                    "name": name,
                    "change": f"{'+' if change_pct >= 0 else ''}{change_pct:.2f}%",
                    "change_raw": change_pct,
                    "price": f"{last_price:,.2f}",
                    "spark": prices
                })

        crypto_data = [r for r in results if r["symbol"] in ["BTC", "ETH"]]
        stock_data = [r for r in results if r["symbol"] not in ["BTC", "ETH"]]

        stock_data.sort(key=lambda x: x["change_raw"], reverse=True)

        return {
            "gainers": stock_data[:4],
            "losers": stock_data[-4:],
            "crypto": crypto_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def fetch_markets_data():
    try:
        stock_tickers = yf.Tickers(" ".join(STOCK_SYMBOLS))
        stocks_data = []
        
        for symbol in STOCK_SYMBOLS:
            info = stock_tickers.tickers[symbol].info
            clean_symbol = symbol.replace("-USD", "")
            
            price = info.get("regularMarketPrice") or info.get("currentPrice", 0)
            prev_close = info.get("regularMarketPreviousClose", price)
            change_percent = ((price - prev_close) / prev_close * 100) if prev_close and price else 0
            
            stocks_data.append({
                "symbol": clean_symbol,
                "name": info.get("shortName") or info.get("longName") or clean_symbol,
                "sector": get_sector(symbol),
                "price": round(price, 2) if price else 0,
                "change": round(change_percent, 2),
                "volume": format_number(info.get("regularMarketVolume") or info.get("volume")),
                "mktCap": format_number(info.get("marketCap")),
                "pe": round(info.get("trailingPE"), 1) if info.get("trailingPE") else None,
                "beta": round(info.get("beta"), 2) if info.get("beta") else None,
                "week52High": round(info.get("fiftyTwoWeekHigh", 0), 2),
                "week52Low": round(info.get("fiftyTwoWeekLow", 0), 2),
                "dividendYield": round(info.get("dividendYield", 0) * 100, 2) if info.get("dividendYield") else 0,
            })

        index_tickers = yf.Tickers(" ".join(INDEX_SYMBOLS.values()))
        indices_data = []
        
        for name, symbol in INDEX_SYMBOLS.items():
            info = index_tickers.tickers[symbol].info
            price = info.get("regularMarketPrice") or info.get("currentPrice") or info.get("previousClose", 0)
            prev_close = info.get("regularMarketPreviousClose", price)
            change_percent = ((price - prev_close) / prev_close * 100) if prev_close and price else 0
            
            indices_data.append({
                "name": name,
                "value": round(price, 2) if price else 0,
                "change": round(change_percent, 2)
            })

        return {"stocks": stocks_data, "indices": indices_data}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))