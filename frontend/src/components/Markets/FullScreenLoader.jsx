import React from "react";
import styles from "../../css/markets.module.css";

export const FullScreenLoader = ({ message = "Loading data..." }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: "1rem",
      }}
    >
      <div className={styles.loaderSpinner}></div>
      <div style={{ color: "#000", fontSize: "1.2rem", fontWeight: "bold" }}>
        {message}
      </div>
    </div>
  );
};
