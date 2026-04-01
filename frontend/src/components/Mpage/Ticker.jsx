import React from "react";
import styles from "../../css/main.module.css";

const Ticker = ({ data }) => (
  <header className={styles.tickerHeader}>
    <div className={styles.tickerWrap}>
      {data.length > 0 && (
        <div className={styles.tickerMove}>
          {[...data, ...data].map((item, index) => (
            <span key={index} className={styles.tickerItem}>
              {item.label}: <span className={styles.value}>{item.value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  </header>
);

export default Ticker;
