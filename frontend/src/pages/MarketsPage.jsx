import React, { useState } from "react";
import { useMarketsData } from "../hooks/Markets/useMarketsData";
import { useMarketsFilterSort } from "../hooks/Markets/useMarketsFilterSort";
import { MarketHeader } from "../components/Markets/MarketHeader";
import { IndicesBar } from "../components/Markets/IndicesBar";
import { MarketControls } from "../components/Markets/MarketControls";
import { TableView } from "../components/Markets/TableView";
import { CardsView } from "../components/Markets/CardsView";
import { StockModal } from "../components/Markets/StockModal";
import styles from "../css/markets.module.css";

export default function MarketsPage() {
  const { stocks, indices, loading } = useMarketsData();
  const {
    sector,
    setSector,
    search,
    setSearch,
    sortKey,
    sortDir,
    handleSort,
    filtered,
  } = useMarketsFilterSort(stocks);

  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("table");

  if (loading) {
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
          Loading real-time market data...
        </div>
      </div>
    );
  }

  return (
    <main className={styles.marketsPage}>
      <MarketHeader data={filtered} />
      <IndicesBar indices={indices} />
      <MarketControls
        sector={sector}
        setSector={setSector}
        search={search}
        setSearch={setSearch}
        view={view}
        setView={setView}
      />

      {view === "table" ? (
        <TableView
          data={filtered}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          onRowClick={setSelected}
        />
      ) : (
        <CardsView data={filtered} onCardClick={setSelected} />
      )}

      <StockModal stock={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
