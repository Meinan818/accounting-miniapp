package cn.miaoji.ledger;

import cn.miaoji.common.ApiException;
import jakarta.validation.Validator;
import java.time.DateTimeException;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LedgerService {
    private static final Map<String, Set<String>> CATEGORIES = Map.of(
            "expense", Set.of("餐饮", "交通", "购物", "娱乐", "住房", "医疗", "学习", "其他"),
            "income", Set.of("工资", "红包", "兼职", "理财", "退款", "其他"));
    private final LedgerRepository repository;
    private final Validator validator;
    public LedgerService(LedgerRepository repository, Validator validator) {
        this.repository = repository;
        this.validator = validator;
    }
    public record MonthSummary(String income, String expense, String balance, long count) {}
    public record RecordPage(List<RecordView> records, int page, int size) {}

    public RecordPage list(long owner, String month, int page, int size) {
        var range = month(month);
        if (page < 0 || page > 10000 || size < 1 || size > 100) throw invalid();
        return new RecordPage(repository.list(owner, range.atDay(1), range.plusMonths(1).atDay(1), page * size, size), page, size);
    }

    public RecordView get(long owner, String id) {
        return repository.find(owner, id).orElseThrow(() ->
                new ApiException(HttpStatus.NOT_FOUND, "RECORD_NOT_FOUND", "账单不存在"));
    }

    @Transactional
    public RecordView update(long owner, String id, long version, RecordInput input) {
        validate(input);
        get(owner, id); // 他人/不存在账单统一404，不泄漏所属者。
        if (version < 0) throw invalid();
        if (!repository.update(owner, id, version, input)) throw conflict();
        return get(owner, id);
    }

    @Transactional
    public void delete(long owner, String id, long version) {
        get(owner, id);
        if (version < 0) throw invalid();
        if (!repository.delete(owner, id, version)) throw conflict();
    }

    public MonthSummary summary(long owner, String month) {
        var range = month(month);
        return repository.summarize(owner, range.atDay(1), range.plusMonths(1).atDay(1));
    }

    private YearMonth month(String text) {
        try {
            if (!text.matches("[0-9]{4}-(0[1-9]|1[0-2])")) throw invalid();
            var value = YearMonth.parse(text);
            if (value.getYear() < 1000 || value.getYear() > 9998) throw invalid();
            return value;
        } catch (DateTimeException error) { throw invalid(); }
    }

    void validate(RecordInput input) {
        if (input == null || !validator.validate(input).isEmpty()) throw invalid();
        if (input.money().signum() <= 0 || input.date().getYear() < 1000 || input.date().getYear() > 9998
                || !CATEGORIES.getOrDefault(input.type(), Set.of()).contains(input.category())) throw invalid();
    }
    private ApiException invalid() { return new ApiException(HttpStatus.BAD_REQUEST, "INVALID_INPUT", "金额、日期或分页参数不合法"); }
    private ApiException conflict() { return new ApiException(HttpStatus.CONFLICT, "STALE_VERSION", "账单已变化，请重新读取后操作"); }
}
