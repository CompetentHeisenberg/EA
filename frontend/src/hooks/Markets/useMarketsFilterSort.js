import { useState, useMemo, useCallback } from "react";

export const useMarketsFilterSort = (stocks) => {
  const [sector, setSector] = useState("All");
  const [sortKey, setSortKey] = useState("symbol");
  const [sortDir, setSortDir] = useState("asc");
  const [search, setSearch] = useState("");

  const handleSort = useCallback(
    (key) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey],
  );

  const filtered = useMemo(() => {
    return stocks
      .filter((s) => {
        const matchSector = sector === "All" || s.sector === sector;
        const matchSearch =
          s.symbol.toLowerCase().includes(search.toLowerCase()) ||
          s.name.toLowerCase().includes(search.toLowerCase());
        return matchSector && matchSearch;
      })
      .sort((a, b) => {
        const va = a[sortKey];
        const vb = b[sortKey];
        if (va == null) return 1;
        if (vb == null) return -1;
        const cmp = typeof va === "string" ? va.localeCompare(vb) : va - vb;
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [stocks, sector, search, sortKey, sortDir]);

  return {
    sector,
    setSector,
    search,
    setSearch,
    sortKey,
    sortDir,
    handleSort,
    filtered,
  };
};
