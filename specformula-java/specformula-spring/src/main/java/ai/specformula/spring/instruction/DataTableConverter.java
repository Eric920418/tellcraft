package ai.specformula.spring.instruction;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import io.cucumber.datatable.DataTable;

/**
 * {@code List<Map<String, String>>} 與 Cucumber {@link DataTable} 之間的轉換工具。
 */
final class DataTableConverter {

    private DataTableConverter() {
    }

    /**
     * 將 {@code List<Map<String, String>>} 轉換為 Cucumber {@link DataTable}。
     * <p>
     * Map 的 key 為 header 欄位名稱，value 為該欄的資料值。
     * 所有 Map 合併為單一 row，不論 List 長度，輸出永遠只有一列資料。
     *
     * @param columns 每筆 Map 的 key = header，value = row data
     * @return Cucumber DataTable（1 header row + 1 data row）
     * @throws IllegalArgumentException 若 columns 為 null 或空
     */
    static DataTable toDataTable(List<Map<String, String>> columns) {
        if (columns == null || columns.isEmpty()) {
            throw new IllegalArgumentException("dataTable 不可為 null 或空");
        }

        Map<String, String> merged = new LinkedHashMap<>();
        for (Map<String, String> map : columns) {
            merged.putAll(map);
        }

        List<String> headers = new ArrayList<>(merged.keySet());
        List<String> values = new ArrayList<>();
        for (String header : headers) {
            values.add(merged.get(header));
        }

        return DataTable.create(List.of(headers, values));
    }
}
