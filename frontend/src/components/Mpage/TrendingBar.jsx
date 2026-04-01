import React from "react";
import styles from "../../css/main.module.css";

const TrendingBar = () => (
  <aside className={styles.rightSidebar}>
    <div className={styles.trendingBlock}>
      <h3>Trending Now</h3>
      <p>#Bitcoin</p>
      <p>#Nvidia</p>
      <p>#AI_Revolution</p>
      <p>#Economy</p>
    </div>
    <div className={styles.trendingBlock}>
      <h3>Top Gainers</h3>
      <p style={{ color: "#00cc66" }}>NVDA +3.2%</p>
      <p style={{ color: "#00cc66" }}>TSLA +1.5%</p>
      <p style={{ color: "#00cc66" }}>AAPL +0.8%</p>
    </div>
  </aside>
);

export default TrendingBar;
