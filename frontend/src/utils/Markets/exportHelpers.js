import * as XLSX from "xlsx";

export const exportCSV = (data) => {
  const headers = [
    "Symbol",
    "Name",
    "Sector",
    "Price",
    "Change%",
    "Volume",
    "MarketCap",
    "PE_Ratio",
    "Beta",
    "52W_High",
    "52W_Low",
    "DividendYield%",
  ];

  const rows = data.map((s) => [
    s.symbol,
    s.name,
    s.sector,
    s.price,
    s.change,
    s.volume,
    s.mktCap,
    s.pe ?? "N/A",
    s.beta,
    s.week52High,
    s.week52Low,
    s.dividendYield,
  ]);

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csv = [headers, ...rows]
    .map((r) => r.map(escapeCSV).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `markets_data_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportExcel = (data) => {
  const formattedData = data.map((s) => ({
    Symbol: s.symbol,
    Name: s.name,
    Sector: s.sector,
    Price: s.price,
    "Change %": s.change,
    Volume: s.volume,
    "Market Cap": s.mktCap,
    "P/E Ratio": s.pe ?? "N/A",
    Beta: s.beta,
    "52W High": s.week52High,
    "52W Low": s.week52Low,
    "Dividend Yield %": s.dividendYield,
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Markets Data");

  XLSX.writeFile(
    workbook,
    `markets_data_${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
};
