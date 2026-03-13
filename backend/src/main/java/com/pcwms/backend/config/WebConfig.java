package com.pcwms.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
//        Path uploadDir = Paths.get("upload");
//        String uploadPath = uploadDir.toFile().getAbsolutePath();
//
//        //Ánh xạ URL "/uploads/**" đến thư mục vật lí trên máy
//        registry.addResourceHandler("/uploads/**").addResourceLocations("file:"+uploadPath+"/" );
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");

    }
}
