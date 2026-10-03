package cn.miaoji;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import cn.miaoji.ledger.LedgerRepository;
import cn.miaoji.ledger.LedgerWriteRepository;
import cn.miaoji.ledger.LedgerWriteService;
import cn.miaoji.ledger.RecordInput;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.http.MediaType;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AccountLedgerIntegrationTest {
    // 仅合成测试凭据，与本机数据库及任何真实账号无关。
    private static final String PASSWORD = "SyntheticPass123!";
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    @Autowired PasswordEncoder encoder;
    @Autowired LedgerWriteService writes;
    @MockitoSpyBean LedgerRepository records;
    @MockitoSpyBean LedgerWriteRepository requests;

    private record Browser(MockHttpSession session, String token) {}

    private Browser anonymous() throws Exception {
        var result = mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andReturn();
        return new Browser((MockHttpSession) result.getRequest().getSession(),
                json.readTree(result.getResponse().getContentAsString()).path("token").asText());
    }

    private Browser refresh(MockHttpSession session) throws Exception {
        var result = mvc.perform(get("/api/auth/csrf").session(session)).andExpect(status().isOk()).andReturn();
        return new Browser(session, json.readTree(result.getResponse().getContentAsString()).path("token").asText());
    }

    private String username() { return "test_" + UUID.randomUUID().toString().replace("-", "").substring(0, 20); }

    private Browser account() throws Exception {
        var browser = anonymous();
        var name = username();
        register(browser, name, PASSWORD).andExpect(status().isCreated());
        mvc.perform(post("/api/auth/login").session(browser.session()).header("X-CSRF-TOKEN", browser.token())
                .param("username", name).param("password", PASSWORD)).andExpect(status().isNoContent());
        return refresh(browser.session());
    }

    private ResultActions register(Browser browser, String name, String password) throws Exception {
        return mvc.perform(post("/api/auth/register").session(browser.session()).header("X-CSRF-TOKEN", browser.token())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(java.util.Map.of("username", name, "password", password))));
    }

    private String input(String amount) {
        return "{\"type\":\"expense\",\"amount\":\"" + amount
                + "\",\"date\":\"2026-10-03\",\"category\":\"餐饮\",\"note\":\"测试午饭\"}";
    }

    private JsonNode create(Browser browser, String amount) throws Exception {
        var result = mvc.perform(post("/api/records").header("Idempotency-Key", UUID.randomUUID().toString()).session(browser.session()).header("X-CSRF-TOKEN", browser.token())
                .contentType(MediaType.APPLICATION_JSON).content(input(amount))).andExpect(status().isCreated()).andReturn();
        return json.readTree(result.getResponse().getContentAsString());
    }

    @Test void anonymousCannotReadWriteOrSummarize() throws Exception {
        mvc.perform(get("/api/records").param("month", "2026-10")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/statistics/month").param("month", "2026-10")).andExpect(status().isUnauthorized());
        var browser = anonymous();
        mvc.perform(post("/api/records").header("Idempotency-Key", UUID.randomUUID().toString()).session(browser.session()).header("X-CSRF-TOKEN", browser.token())
                .contentType(MediaType.APPLICATION_JSON).content(input("1.00"))).andExpect(status().isUnauthorized());
    }

    @Test void passwordIsHashedAndWrongPasswordNeverAuthenticates() throws Exception {
        var browser = anonymous();
        var name = username();
        register(browser, name, PASSWORD).andExpect(status().isCreated());
        var hash = jdbc.queryForObject("SELECT password_hash FROM app_user WHERE username = ?", String.class, name);
        assertThat(hash).isNotEqualTo(PASSWORD);
        assertThat(encoder.matches(PASSWORD, hash)).isTrue();
        mvc.perform(post("/api/auth/login").session(browser.session()).header("X-CSRF-TOKEN", browser.token())
                .param("username", name).param("password", "wrong")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").session(browser.session())).andExpect(status().isUnauthorized());
    }

    @Test void normalizedUsernameHasUniqueConstraint() throws Exception {
        var browser = anonymous();
        var name = username();
        register(browser, name, PASSWORD).andExpect(status().isCreated());
        register(browser, name.toUpperCase(java.util.Locale.ROOT), PASSWORD).andExpect(status().isConflict());
    }

    @Test void loginChangesSessionIdAndNeverReturnsPasswordHash() throws Exception {
        var browser = anonymous();
        var name = username();
        register(browser, name, PASSWORD).andExpect(status().isCreated());
        var oldId = browser.session().getId();
        mvc.perform(post("/api/auth/login").session(browser.session()).header("X-CSRF-TOKEN", browser.token())
                .param("username", name).param("password", PASSWORD)).andExpect(status().isNoContent());
        assertThat(browser.session().getId()).isNotEqualTo(oldId);
        mvc.perform(get("/api/auth/me").session(browser.session())).andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(name)).andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test void csrfRequiredForRegisterLoginWriteAndLogout() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"example\",\"password\":\"SyntheticPass123!\"}")).andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/login").param("username", "example").param("password", PASSWORD))
                .andExpect(status().isForbidden());
        var browser = account();
        mvc.perform(post("/api/records").header("Idempotency-Key", UUID.randomUUID().toString()).session(browser.session()).contentType(MediaType.APPLICATION_JSON)
                .content(input("1.00"))).andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/logout").session(browser.session())).andExpect(status().isForbidden());
    }

    @Test void otherAccountCannotReadUpdateDeleteOrSummarizeRecord() throws Exception {
        var alice = account();
        var bob = account();
        var record = create(alice, "25.10");
        var id = record.path("id").asText();
        mvc.perform(get("/api/records/" + id).session(bob.session())).andExpect(status().isNotFound());
        mvc.perform(put("/api/records/" + id).session(bob.session()).header("X-CSRF-TOKEN", bob.token())
                .contentType(MediaType.APPLICATION_JSON).content("{\"version\":0,\"record\":" + input("9.00") + "}"))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/records/" + id).session(bob.session()).header("X-CSRF-TOKEN", bob.token())
                .param("version", "0")).andExpect(status().isNotFound());
        mvc.perform(get("/api/records").session(bob.session()).param("month", "2026-10").param("user_id", "1"))
                .andExpect(jsonPath("$.records").isEmpty());
        mvc.perform(get("/api/statistics/month").session(bob.session()).param("month", "2026-10"))
                .andExpect(jsonPath("$.expense").value("0.00")).andExpect(jsonPath("$.count").value(0));
        mvc.perform(get("/api/records/" + id).session(alice.session())).andExpect(jsonPath("$.amount").value("25.10"));
    }

    @Test void unknownOwnerFieldsAreRejectedRatherThanTrusted() throws Exception {
        var browser = account();
        var body = input("1.00").replace("}", ",\"user_id\":123}");
        mvc.perform(post("/api/records").header("Idempotency-Key", UUID.randomUUID().toString()).session(browser.session()).header("X-CSRF-TOKEN", browser.token())
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
    }

    @Test void updateRequiresCurrentVersionAndDeletedRecordCannotBeRestored() throws Exception {
        var browser = account();
        var id = create(browser, "0.10").path("id").asText();
        var update = "{\"version\":0,\"record\":" + input("0.20") + "}";
        mvc.perform(put("/api/records/" + id).session(browser.session()).header("X-CSRF-TOKEN", browser.token())
                .contentType(MediaType.APPLICATION_JSON).content(update)).andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(1));
        mvc.perform(put("/api/records/" + id).session(browser.session()).header("X-CSRF-TOKEN", browser.token())
                .contentType(MediaType.APPLICATION_JSON).content(update)).andExpect(status().isConflict());
        mvc.perform(delete("/api/records/" + id).session(browser.session()).header("X-CSRF-TOKEN", browser.token())
                .param("version", "0")).andExpect(status().isConflict());
        mvc.perform(delete("/api/records/" + id).session(browser.session()).header("X-CSRF-TOKEN", browser.token())
                .param("version", "1")).andExpect(status().isNoContent());
        mvc.perform(get("/api/records/" + id).session(browser.session())).andExpect(status().isNotFound());
        mvc.perform(put("/api/records/" + id).session(browser.session()).header("X-CSRF-TOKEN", browser.token())
                .contentType(MediaType.APPLICATION_JSON).content(update)).andExpect(status().isNotFound());
        mvc.perform(get("/api/statistics/month").session(browser.session()).param("month", "2026-10"))
                .andExpect(jsonPath("$.count").value(0));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM ledger_record WHERE id = ? AND deleted_at IS NOT NULL", Long.class, id)).isEqualTo(1);
    }

    @Test void decimalStatisticsUseBusinessMonthAndNotFloatOrDeletedData() throws Exception {
        var browser = account();
        create(browser, "0.10");
        create(browser, "0.20");
        mvc.perform(post("/api/records").header("Idempotency-Key", UUID.randomUUID().toString()).session(browser.session()).header("X-CSRF-TOKEN", browser.token())
                .contentType(MediaType.APPLICATION_JSON).content(input("100.00").replace("expense", "income").replace("餐饮", "工资")))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/records").header("Idempotency-Key", UUID.randomUUID().toString()).session(browser.session()).header("X-CSRF-TOKEN", browser.token())
                .contentType(MediaType.APPLICATION_JSON).content(input("10.00").replace("2026-10-03", "2026-11-01")))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/statistics/month").session(browser.session()).param("month", "2026-10"))
                .andExpect(jsonPath("$.expense").value("0.30")).andExpect(jsonPath("$.income").value("100.00"))
                .andExpect(jsonPath("$.balance").value("99.70")).andExpect(jsonPath("$.count").value(3));
    }

    @ParameterizedTest @ValueSource(strings = {"0", "-1", "1.001", "1e3", "NaN", "1000000000", "01.00"})
    void invalidMoneyCannotBeWritten(String amount) throws Exception {
        var browser = account();
        mvc.perform(post("/api/records").header("Idempotency-Key", UUID.randomUUID().toString()).session(browser.session()).header("X-CSRF-TOKEN", browser.token())
                .contentType(MediaType.APPLICATION_JSON).content(input(amount))).andExpect(status().isBadRequest());
    }

    @Test void invalidDatesCategoriesAndPagingAreRejected() throws Exception {
        var browser = account();
        for (var body : java.util.List.of(input("1").replace("2026-10-03", "2026-02-30"),
                input("1").replace("餐饮", "工资"), input("1").replace("2026-10-03", "0001-01-01"))) {
            mvc.perform(post("/api/records").header("Idempotency-Key", UUID.randomUUID().toString()).session(browser.session()).header("X-CSRF-TOKEN", browser.token())
                    .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
        }
        mvc.perform(get("/api/records").session(browser.session()).param("month", "2026-13")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/records").session(browser.session()).param("month", "2026-10").param("size", "101"))
                .andExpect(status().isBadRequest());
    }

    @Test void logoutAndInvalidSessionCannotReadPersistedLedger() throws Exception {
        var browser = account();
        var id = create(browser, "12.00").path("id").asText();
        mvc.perform(post("/api/auth/logout").session(browser.session()).header("X-CSRF-TOKEN", browser.token()))
                .andExpect(status().isNoContent());
        assertThat(browser.session().isInvalid()).isTrue();
        mvc.perform(get("/api/records/" + id).cookie(new jakarta.servlet.http.Cookie("MIAOJI_SESSION", browser.session().getId())))
                .andExpect(status().isUnauthorized());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM ledger_record WHERE id = ?", Long.class, id)).isEqualTo(1);
    }

    @Test void invalidPasswordNeverAppearsInErrorResponse() throws Exception {
        var browser = anonymous();
        var result = register(browser, username(), "shortSecret").andExpect(status().isBadRequest()).andReturn();
        assertThat(result.getResponse().getContentAsString()).doesNotContain("shortSecret", "password_hash", "INSERT");
    }

    @Test void moneyMustBeJsonStringAndMissingInputsNeverWrite() throws Exception {
        var browser = account();
        for (var body : java.util.List.of(input("1.20").replace("\"1.20\"", "1.20"),
                input("1.20").replace("\"amount\":\"1.20\",", ""))) {
            mvc.perform(post("/api/records").header("Idempotency-Key", UUID.randomUUID().toString()).session(browser.session()).header("X-CSRF-TOKEN", browser.token())
                    .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
        }
        mvc.perform(get("/api/statistics/month").session(browser.session()).param("month", "2026-10"))
                .andExpect(jsonPath("$.count").value(0));
        mvc.perform(get("/api/records").session(browser.session())).andExpect(status().isBadRequest());
    }

    @Test void loginInvalidatesPreLoginCsrfTokenAndPagingDoesNotMixAccounts() throws Exception {
        var browser = anonymous();
        var name = username();
        register(browser, name, PASSWORD).andExpect(status().isCreated());
        mvc.perform(post("/api/auth/login").session(browser.session()).header("X-CSRF-TOKEN", browser.token())
                .param("username", name).param("password", PASSWORD)).andExpect(status().isNoContent());
        mvc.perform(post("/api/records").header("Idempotency-Key", UUID.randomUUID().toString()).session(browser.session()).header("X-CSRF-TOKEN", browser.token())
                .contentType(MediaType.APPLICATION_JSON).content(input("1.00"))).andExpect(status().isForbidden());
        var authenticated = refresh(browser.session());
        var first = create(authenticated, "1.00").path("id").asText();
        var second = create(authenticated, "2.00").path("id").asText();
        create(account(), "99.00");
        var page0 = mvc.perform(get("/api/records").session(authenticated.session())
                .param("month", "2026-10").param("size", "1")).andExpect(status().isOk()).andReturn();
        var page1 = mvc.perform(get("/api/records").session(authenticated.session())
                .param("month", "2026-10").param("size", "1").param("page", "1"))
                .andExpect(status().isOk()).andReturn();
        var id0 = json.readTree(page0.getResponse().getContentAsString()).path("records").get(0).path("id").asText();
        var id1 = json.readTree(page1.getResponse().getContentAsString()).path("records").get(0).path("id").asText();
        assertThat(java.util.Set.of(id0, id1)).containsExactlyInAnyOrder(first, second);
    }

    private long owner(Browser browser) throws Exception {
        var result = mvc.perform(get("/api/auth/me").session(browser.session())).andReturn();
        return json.readTree(result.getResponse().getContentAsString()).path("id").asLong();
    }

    private ResultActions write(Browser browser, UUID key, String body, boolean batch) throws Exception {
        return mvc.perform(post(batch ? "/api/records/batch" : "/api/records").session(browser.session())
                .header("X-CSRF-TOKEN", browser.token()).header("Idempotency-Key", key.toString())
                .contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private String batch(String... amounts) {
        return "{\"records\":[" + String.join(",", java.util.Arrays.stream(amounts).map(this::input).toList()) + "]}";
    }

    private void noWrites(long owner) {
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM ledger_record WHERE user_id = ?", Long.class, owner)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM ledger_write_request WHERE user_id = ?", Long.class, owner)).isZero();
    }

    @Test void sameKeySameMeaningReplaysAndOtherPayloadOrEndpointConflicts() throws Exception {
        var browser = account();
        var key = UUID.randomUUID();
        var original = write(browser, key, input("1"), false).andExpect(status().isCreated())
                .andExpect(header().string("Idempotency-Replayed", "false")).andReturn();
        var replay = write(browser, key, input("1.00"), false).andExpect(status().isOk())
                .andExpect(header().string("Idempotency-Replayed", "true")).andReturn();
        assertThat(replay.getResponse().getContentAsString()).isEqualTo(original.getResponse().getContentAsString());
        write(browser, key, input("2.00"), false).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("REQUEST_KEY_REUSED"));
        write(browser, key, batch("1.00"), true).andExpect(status().isConflict());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM ledger_record WHERE user_id = ?", Long.class, owner(browser))).isEqualTo(1);
    }

    @Test void requestKeysAreScopedToAccountAndDeletedRecordIsNeverRecreatedByRetry() throws Exception {
        var alice = account();
        var bob = account();
        var key = UUID.randomUUID();
        var original = write(alice, key, input("2.00"), false).andExpect(status().isCreated()).andReturn();
        var id = json.readTree(original.getResponse().getContentAsString()).path("id").asText();
        var other = write(bob, key, input("9.00"), false).andExpect(status().isCreated()).andReturn();
        assertThat(json.readTree(other.getResponse().getContentAsString()).path("id").asText()).isNotEqualTo(id);
        mvc.perform(delete("/api/records/" + id).session(alice.session()).header("X-CSRF-TOKEN", alice.token())
                .param("version", "0")).andExpect(status().isNoContent());
        write(alice, key, input("2.00"), false).andExpect(status().isOk()).andExpect(jsonPath("$.id").value(id));
        mvc.perform(get("/api/records/" + id).session(alice.session())).andExpect(status().isNotFound());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM ledger_record WHERE user_id = ?", Long.class, owner(alice))).isEqualTo(1);
    }

    @Test void mixedBatchCommitsOnceAndSemanticOrStructuralErrorsCommitNothing() throws Exception {
        var browser = account();
        var key = UUID.randomUUID();
        var invalid = batch("1.00", "2.00").replace("2.00", "0.00");
        write(browser, key, invalid, true).andExpect(status().isBadRequest());
        for (var invalidBody : List.of(batch(), batch("1", "2", "3", "4", "5", "6"),
                "{\"records\":[null]}", batch("1").replace("餐饮", "工资"))) {
            write(browser, key, invalidBody, true).andExpect(status().isBadRequest());
        }
        noWrites(owner(browser));
        var body = "{\"records\":[" + input("0.10") + "," + input("100.00").replace("expense", "income").replace("餐饮", "工资") + "]}";
        var original = write(browser, key, body, true).andExpect(status().isCreated())
                .andExpect(jsonPath("$.records.length()").value(2)).andReturn();
        var replay = write(browser, key, body, true).andExpect(status().isOk()).andReturn();
        assertThat(replay.getResponse().getContentAsString()).isEqualTo(original.getResponse().getContentAsString());
        mvc.perform(get("/api/statistics/month").session(browser.session()).param("month", "2026-10"))
                .andExpect(jsonPath("$.income").value("100.00")).andExpect(jsonPath("$.expense").value("0.10"))
                .andExpect(jsonPath("$.count").value(2));
    }

    @Test void storageFailureAfterSecondInsertRollsBackWholeBatchAndAllowsSameKeyRetry() throws Exception {
        var browser = account();
        var owner = owner(browser);
        var key = UUID.randomUUID();
        var count = new AtomicInteger();
        doAnswer(invocation -> {
            invocation.callRealMethod();
            if (count.incrementAndGet() == 2) throw new DataIntegrityViolationException("synthetic storage fault");
            return null;
        }).when(records).insert(eq(owner), anyString(), any(RecordInput.class));
        write(browser, key, batch("0.10", "0.20"), true).andExpect(status().isServiceUnavailable());
        noWrites(owner);
        reset(records);
        write(browser, key, batch("0.10", "0.20"), true).andExpect(status().isCreated());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM ledger_record WHERE user_id = ?", Long.class, owner)).isEqualTo(2);
    }

    @Test void receiptFailureRollsBackRecordAndRequestKeyTogether() throws Exception {
        var browser = account();
        var owner = owner(browser);
        var key = UUID.randomUUID();
        doThrow(new DataIntegrityViolationException("synthetic receipt fault"))
                .when(requests).complete(eq(owner), anyString(), anyString());
        write(browser, key, input("1.00"), false).andExpect(status().isServiceUnavailable());
        noWrites(owner);
        reset(requests);
        write(browser, key, input("1.00"), false).andExpect(status().isCreated());
    }

    @Test void concurrentIdenticalRequestsOnlyCreateOneRecord() throws Exception {
        var browser = account();
        var owner = owner(browser);
        var key = UUID.randomUUID();
        var start = new CountDownLatch(1);
        var input = new RecordInput("expense", "1.20", java.time.LocalDate.of(2026, 10, 3), "餐饮", "合成并发测试");
        try (var executor = Executors.newFixedThreadPool(6)) {
            var futures = java.util.stream.IntStream.range(0, 6).mapToObj(index -> executor.submit(() -> {
                start.await();
                return writes.single(owner, key, input);
            })).toList();
            start.countDown();
            var receipts = new java.util.ArrayList<LedgerWriteService.WriteReceipt>();
            for (var future : futures) receipts.add(future.get(15, TimeUnit.SECONDS));
            assertThat(receipts.stream().filter(receipt -> !receipt.replayed()).count()).isEqualTo(1);
            assertThat(receipts.stream().map(receipt -> receipt.records().getFirst().id()).distinct().count()).isEqualTo(1);
        }
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM ledger_record WHERE user_id = ?", Long.class, owner)).isEqualTo(1);
    }

    @Test void missingAndInvalidRequestKeysCannotWrite() throws Exception {
        var browser = account();
        mvc.perform(post("/api/records").session(browser.session()).header("X-CSRF-TOKEN", browser.token())
                .contentType(MediaType.APPLICATION_JSON).content(input("1.00"))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/records/batch").session(browser.session()).header("X-CSRF-TOKEN", browser.token())
                .header("Idempotency-Key", "invalid-key").contentType(MediaType.APPLICATION_JSON).content(batch("1.00")))
                .andExpect(status().isBadRequest());
        noWrites(owner(browser));
    }
}
