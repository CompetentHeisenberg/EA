import React from "react";
import { SortIcon } from "./SortIcon";
import { MiniSparkline } from "./MiniSparkline";
import { sentimentLabel as SentimentLabel } from "../../assets/sentiment";
import styles from "../../css/markets.module.css";

export const TableView = ({ data, sortKey, sortDir, onSort, onRowClick }) => {
  const columns = [
    ["symbol", "Symbol"],
    ["name", "Name"],
    ["sector", "Sector"],
    ["price", "Price"],
    ["change", "Change %"],
    ["volume", "Volume"],
    ["mktCap", "Mkt Cap"],
    ["pe", "P/E"],
    ["beta", "Beta"],
    ["week52High", "52W High"],
    ["week52Low", "52W Low"],
    ["dividendYield", "Div. Yield"],
  ];

  return (
    <div className={styles.tableWrap}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            {columns.map(([key, label]) => (
              <th
                key={key}
                className={styles.th}
                onClick={() => onSort(key)}
                style={{ cursor: "pointer" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  {label}{" "}
                  <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
                </div>
              </th>
            ))}
            <th className={styles.th}>Trend</th>
          </tr>
        </thead>
        <tbody>
          {data.map((s) => (
            <tr
              key={s.symbol}
              className={styles.tr}
              onClick={() => onRowClick(s)}
            >
              <td className={styles.symbolCell}>{s.symbol}</td>
              <td className={styles.td}>{s.name}</td>
              <td className={styles.td}>
                <span className={styles.sectorBadge}>{s.sector}</span>
              </td>
              <td
                className={styles.td}
                style={{ fontWeight: 600, fontFamily: "monospace" }}
              >
                {s.sector === "Crypto"
                  ? "$" +
                    s.price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })
                  : "$" + s.price.toFixed(2)}
              </td>
              <td
                className={s.change >= 0 ? styles.posChange : styles.negChange}
              >
                {s.change >= 0 ? (
                  <SentimentLabel.positive.icon />
                ) : (
                  <SentimentLabel.negative.icon />
                )}{" "}
                {Math.abs(s.change).toFixed(2)}%
              </td>
              <td className={styles.td}>{s.volume}</td>
              <td className={styles.td}>{s.mktCap}</td>
              <td className={styles.td}>{s.pe ?? "N/A"}</td>
              <td className={styles.td}>{s.beta}</td>
              <td className={styles.td}>{s.week52High.toLocaleString()}</td>
              <td className={styles.td}>{s.week52Low.toLocaleString()}</td>
              <td
                className={s.dividendYield > 0 ? styles.posChange : styles.td}
              >
                {s.dividendYield}%
              </td>
              <td className={styles.td}>
                <MiniSparkline change={s.change} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
