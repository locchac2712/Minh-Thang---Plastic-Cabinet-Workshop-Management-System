package com.tuplastic.erp.common.config;

import com.tuplastic.erp.common.dto.chart.ChartGranularity;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.format.FormatterRegistry;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Cho phép {@code granularity=day|week|month} (chữ thường) trong query string của các chart endpoint.
 * Mặc định Spring MVC dùng {@link Enum#valueOf(Class, String)} đòi hỏi chữ HOA → 500.
 */
@Configuration
public class ChartGranularityWebConfig implements WebMvcConfigurer {

    @Override
    public void addFormatters(@NonNull FormatterRegistry registry) {
        registry.addConverter(new Converter<String, ChartGranularity>() {
            @Override
            public ChartGranularity convert(@NonNull String source) {
                if (source.isBlank()) {
                    return null;
                }
                return ChartGranularity.valueOf(source.trim().toUpperCase());
            }
        });
    }
}
