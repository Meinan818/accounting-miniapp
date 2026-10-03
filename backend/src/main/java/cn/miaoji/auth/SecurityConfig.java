package cn.miaoji.auth;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
    @Bean
    PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/csrf", "/api/auth/register", "/api/auth/login").permitAll()
                        .anyRequest().authenticated())
                .requestCache(cache -> cache.disable())
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((req, res, error) -> reply(res, 401, "UNAUTHENTICATED"))
                        .accessDeniedHandler((req, res, error) -> reply(res, 403, "FORBIDDEN")))
                .formLogin(login -> login
                        .loginProcessingUrl("/api/auth/login")
                        .successHandler((req, res, auth) -> res.setStatus(204))
                        .failureHandler((req, res, error) -> reply(res, 401, "INVALID_CREDENTIALS")))
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .deleteCookies("MIAOJI_SESSION")
                        .logoutSuccessHandler((req, res, auth) -> res.setStatus(204)))
                // 保留默认 CSRF、登录时更换 session id、退出使 session 失效。
                .build();
    }

    private static void reply(HttpServletResponse res, int status, String code) throws IOException {
        res.setStatus(status);
        res.setContentType("application/json;charset=UTF-8");
        res.getWriter().write("{\"code\":\"" + code + "\"}");
    }
}
