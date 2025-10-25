package com.mysite.auth_service.configuration;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "email")
public class EmailProperties {

    /**
     * Email mode: "ses" for AWS SES, "smtp" for local/dev SMTP
     */
    private String mode;

    private Smtp smtp = new Smtp();
    private Ses ses = new Ses();

    @Data
    public static class Smtp {
        private String host;
        private int port;
        private String username;
        private String password;
    }

    @Data
    public static class Ses {
        private String region;
    }
}
