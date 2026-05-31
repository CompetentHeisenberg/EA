import React from "react";
import { SECTORS } from "../../constants/markets";
import { workspaceIcons as WorkspaceIcons } from "../../assets/sentiment";
import styles from "../../css/markets.module.css";

export const MarketControls = ({
  sector,
  setSector,
  search,
  setSearch,
  view,
  setView,
}) => {
  return (
    <div className={styles.controls}>
      <div className={styles.sectorTabs}>
        {SECTORS.map((s) => (
          <button
            key={s}
            className={s === sector ? styles.sectorTabActive : styles.sectorTab}
            onClick={() => setSector(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <div className={styles.rightControls}>
        <input
          className={styles.searchInput}
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className={styles.viewToggle}>
          <button
            className={view === "table" ? styles.viewBtnActive : styles.viewBtn}
            onClick={() => setView("table")}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <WorkspaceIcons.correlation /> Table
          </button>
          <button
            className={view === "cards" ? styles.viewBtnActive : styles.viewBtn}
            onClick={() => setView("cards")}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <WorkspaceIcons.pca /> Cards
          </button>
        </div>
      </div>
    </div>
  );
};
