import { useCallback } from "react";
import ExcelExportService, { ExportConfig } from "@/lib/excelExport";

interface UseExcelExportOptions {
  defaultFileName?: string;
  defaultSheetName?: string;
}

export const useExcelExport = (options?: UseExcelExportOptions) => {
  const exportData = useCallback(
    (data: any[], config?: ExportConfig) => {
      const finalConfig: ExportConfig = {
        fileName: options?.defaultFileName,
        sheetName: options?.defaultSheetName,
        ...config,
      };

      ExcelExportService.exportToExcel(data, finalConfig);
    },
    [options],
  );

  const exportGroupedByMonth = useCallback(
    (data: any[], transformFn?: (item: any) => any, baseFileName?: string) => {
      const grouped = ExcelExportService.groupByMonth(data);

      grouped.forEach((items, month) => {
        const exportItems = transformFn ? items.map(transformFn) : items;
        const fileName = `${baseFileName || "Export"}_${month.replace(/ /g, "_")}.xlsx`;

        ExcelExportService.exportToExcel(exportItems, {
          fileName,
          sheetName: month.substring(0, 31), // Excel sheet name max length 31
        });
      });
    },
    [],
  );

  const getMonths = useCallback((data: any[]) => {
    return ExcelExportService.getAvailableMonths(data);
  }, []);

  return {
    exportData,
    exportGroupedByMonth,
    getMonths,
  };
};
