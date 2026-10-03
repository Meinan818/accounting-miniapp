package cn.miaoji.ledger;

import cn.miaoji.auth.AccountPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class LedgerController {
    private final LedgerService ledger;
    public LedgerController(LedgerService ledger) { this.ledger = ledger; }
    public record UpdateRequest(@NotNull Long version, @NotNull @Valid RecordInput record) {}

    @GetMapping("/records")
    public LedgerService.RecordPage list(@AuthenticationPrincipal AccountPrincipal user,
            @RequestParam String month, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ledger.list(user.id(), month, page, size);
    }

    @PostMapping("/records")
    @ResponseStatus(HttpStatus.CREATED)
    public RecordView create(@AuthenticationPrincipal AccountPrincipal user, @Valid @RequestBody RecordInput input) {
        return ledger.create(user.id(), input);
    }

    @GetMapping("/records/{id}")
    public RecordView get(@AuthenticationPrincipal AccountPrincipal user, @PathVariable UUID id) {
        return ledger.get(user.id(), id.toString());
    }

    @PutMapping("/records/{id}")
    public RecordView update(@AuthenticationPrincipal AccountPrincipal user, @PathVariable UUID id,
            @Valid @RequestBody UpdateRequest input) {
        return ledger.update(user.id(), id.toString(), input.version(), input.record());
    }

    @DeleteMapping("/records/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AccountPrincipal user, @PathVariable UUID id, @RequestParam long version) {
        ledger.delete(user.id(), id.toString(), version);
    }

    @GetMapping("/statistics/month")
    public LedgerService.MonthSummary summary(@AuthenticationPrincipal AccountPrincipal user, @RequestParam String month) {
        return ledger.summary(user.id(), month);
    }
}
