package cn.miaoji.ledger;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class LedgerRepository {
    private static final RowMapper<RecordView> MAPPER = (rs, row) -> new RecordView(
            rs.getString("id"), rs.getString("type"), rs.getBigDecimal("amount").toPlainString(),
            rs.getDate("business_date").toLocalDate(), rs.getString("category"), rs.getString("note"), rs.getLong("version"));
    private final JdbcTemplate jdbc;
    public LedgerRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public Optional<RecordView> find(long owner, String id) {
        return jdbc.query("SELECT * FROM ledger_record WHERE user_id = ? AND id = ? AND deleted_at IS NULL",
                MAPPER, owner, id).stream().findFirst();
    }

    public List<RecordView> list(long owner, LocalDate start, LocalDate end, int offset, int limit) {
        return jdbc.query("""
                SELECT * FROM ledger_record WHERE user_id = ? AND deleted_at IS NULL
                AND business_date >= ? AND business_date < ?
                ORDER BY business_date DESC, created_at DESC, id LIMIT ? OFFSET ?
                """, MAPPER, owner, start, end, limit, offset);
    }

    public void insert(long owner, String id, RecordInput input) {
        jdbc.update("""
                INSERT INTO ledger_record (id, user_id, type, amount, business_date, category, note)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, id, owner, input.type(), input.money(), input.date(), input.category(), input.note());
    }

    public boolean update(long owner, String id, long version, RecordInput input) {
        return jdbc.update("""
                UPDATE ledger_record SET type = ?, amount = ?, business_date = ?, category = ?, note = ?,
                version = version + 1, updated_at = CURRENT_TIMESTAMP(6)
                WHERE user_id = ? AND id = ? AND version = ? AND deleted_at IS NULL
                """, input.type(), input.money(), input.date(), input.category(), input.note(), owner, id, version) == 1;
    }

    public boolean delete(long owner, String id, long version) {
        return jdbc.update("""
                UPDATE ledger_record SET deleted_at = CURRENT_TIMESTAMP(6), updated_at = CURRENT_TIMESTAMP(6),
                version = version + 1 WHERE user_id = ? AND id = ? AND version = ? AND deleted_at IS NULL
                """, owner, id, version) == 1;
    }

    public LedgerService.MonthSummary summarize(long owner, LocalDate start, LocalDate end) {
        return jdbc.queryForObject("""
                SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense, COUNT(*) AS record_count
                FROM ledger_record WHERE user_id = ? AND deleted_at IS NULL
                AND business_date >= ? AND business_date < ?
                """, (rs, row) -> {
                    var income = rs.getBigDecimal("income").setScale(2);
                    var expense = rs.getBigDecimal("expense").setScale(2);
                    return new LedgerService.MonthSummary(income.toPlainString(), expense.toPlainString(),
                            income.subtract(expense).toPlainString(), rs.getLong("record_count"));
                }, owner, start, end);
    }
}
