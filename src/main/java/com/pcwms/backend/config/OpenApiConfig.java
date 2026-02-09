package com.pcwms.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
//len trang nay de xem API
//http://localhost:8080/swagger-ui/index.html
@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info().title("AICARE API Documentation")
                        .description("Tài liệu API cho dự án Tốt nghiệp AICARE")
                        .version("1.0.0"))
                .servers(List.of(new Server().url("http://localhost:8080").description("Local Server")));
    }
}