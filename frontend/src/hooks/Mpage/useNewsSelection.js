import { useState, useCallback } from "react";

export const useNewsSelection = () => {
  const [selectedNews, setSelectedNews] = useState(null);

  const handleNewsClick = useCallback((newsItem) => {
    setSelectedNews(newsItem);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleBack = useCallback(() => {
    setSelectedNews(null);
  }, []);

  return {
    selectedNews,
    handleNewsClick,
    handleBack,
  };
};
