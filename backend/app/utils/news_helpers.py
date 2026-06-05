import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from app.constants.news import CATEGORIES

nltk.download('vader_lexicon', quiet=True)
sia = SentimentIntensityAnalyzer()

def categorize_news(text: str) -> str:
    text_lower = text.lower()
    for category, keywords in CATEGORIES.items():
        if any(word in text_lower for word in keywords):
            return category
    return "Markets"

def get_sentiment(text: str) -> str:
    score = sia.polarity_scores(text)['compound']
    if score > 0.15:
        return "positive"
    elif score < -0.15:
        return "negative"
    return "neutral"