package cn.miaoji.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AccountService accounts;
    public AuthController(AccountService accounts) { this.accounts = accounts; }

    public record RegisterRequest(
            @NotNull @Pattern(regexp = "[A-Za-z0-9_]{3,32}") String username,
            // BCrypt 有72字节上限；本阶段密码限定12–64个可见ASCII字符，不截断。
            @NotNull @Pattern(regexp = "[\\x21-\\x7E]{12,64}") String password) {}

    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of("headerName", token.getHeaderName(), "token", token.getToken());
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public void register(@Valid @RequestBody RegisterRequest input) {
        accounts.register(input.username(), input.password());
    }

    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal AccountPrincipal principal) {
        return Map.of("id", Long.toString(principal.id()), "username", principal.getUsername());
    }
}
