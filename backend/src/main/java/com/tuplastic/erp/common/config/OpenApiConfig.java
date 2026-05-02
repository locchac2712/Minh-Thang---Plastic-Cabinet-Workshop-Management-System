package com.tuplastic.erp.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private final String openApiServerUrl;

    public OpenApiConfig(@Value("${app.openapi.server-url:}") String openApiServerUrl) {
        this.openApiServerUrl = trimTrailingSlash(openApiServerUrl);
    }

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "Bearer JWT";
        return new OpenAPI()
                .servers(buildServers())
                .info(new Info()
                        .title("TuPlastic ERP API")
                        .description("API Documentation - Hệ thống Quản lý Sản xuất & Kinh doanh Tủ Nhựa B2B")
                        .version("1.0.0")
                        .contact(new Contact().name("TuPlastic Team")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")));
    }

    private List<Server> buildServers() {
        List<Server> servers = new ArrayList<>();
        servers.add(new Server().url("http://localhost:8080").description("Local"));
        if (!openApiServerUrl.isBlank()) {
            servers.add(new Server().url(openApiServerUrl).description("Deployed"));
        }
        return servers;
    }

    private static String trimTrailingSlash(String url) {
        if (url == null || url.isBlank()) {
            return "";
        }
        String u = url.trim();
        while (u.endsWith("/")) {
            u = u.substring(0, u.length() - 1);
        }
        return u;
    }
}
