import * as XLSX from "xlsx";

export interface ExportDataItem {
  [key: string]: any;
}

export interface ExportConfig {
  fileName?: string;
  sheetName?: string;
  columns?: {
    header: string;
    accessor: string | ((item: any) => any);
  }[];
}

class ExcelExportService {
  /**
   * Export data to Excel file
   * @param data - Array of objects to export
   * @param config - Export configuration
   */
  static exportToExcel(data: ExportDataItem[], config?: ExportConfig) {
    let exportData: ExportDataItem[] = [];

    if (config?.columns) {
      // Transform data based on column configuration
      exportData = data.map((item) => {
        const transformed: ExportDataItem = {};
        config.columns?.forEach((col) => {
          const value =
            typeof col.accessor === "function"
              ? col.accessor(item)
              : item[col.accessor];
          transformed[col.header] = value;
        });
        return transformed;
      });
    } else {
      // Use raw data
      exportData = data;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      config?.sheetName || "Data",
    );

    const fileName =
      config?.fileName ||
      `Export_${new Date().toLocaleString("default", { month: "short", year: "numeric" })}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  /**
   * Group payments by month
   */
  static groupByMonth<T extends { createdAt: string | Date }>(data: T[]) {
    const grouped = new Map<string, T[]>();

    data.forEach((item) => {
      const date = new Date(item.createdAt);
      const monthYear = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      if (!grouped.has(monthYear)) {
        grouped.set(monthYear, []);
      }
      grouped.get(monthYear)!.push(item);
    });

    return grouped;
  }

  /**
   * Get unique months from data
   */
  static getAvailableMonths<T extends { createdAt: string | Date }>(data: T[]) {
    const months = new Set<string>();
    data.forEach((item) => {
      const date = new Date(item.createdAt);
      const monthYear = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      months.add(monthYear);
    });
    return Array.from(months).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateB.getTime() - dateA.getTime();
    });
  }
}

export default ExcelExportService;
