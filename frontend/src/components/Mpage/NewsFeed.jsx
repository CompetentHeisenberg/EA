import React from "react";
import styles from "../../css/main.module.css";

const NewsFeed = () => (
  <main className={styles.mainFeed}>
    <h1>Market Feed</h1>
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className={styles.newsCard}>
        <h2 style={{ color: "#D90429", marginBottom: "10px" }}>
          Market Update #{i + 1}
        </h2>
        <p>Global markets analysis for your thesis research.</p>
      </div>
    ))}
  </main>
);

export default NewsFeed;
