package cn.miaoji.ledger;

import java.time.LocalDate;

public record RecordView(String id, String type, String amount, LocalDate date,
        String category, String note, long version) {}
