package com.tuplastic.erp.common.advice;

import com.tuplastic.erp.common.dto.ApiResponse;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

/**
 * Automatically wraps raw controller return values into {@link ApiResponse}.
 * Excludes Swagger/OpenAPI endpoints and responses already wrapped.
 */
@RestControllerAdvice(basePackages = "com.tuplastic.erp")
public class GlobalResponseHandler implements ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        return !returnType.getParameterType().isAssignableFrom(ApiResponse.class);
    }

    @Override
    public Object beforeBodyWrite(Object body,
                                  MethodParameter returnType,
                                  MediaType selectedContentType,
                                  Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                  ServerHttpRequest request,
                                  ServerHttpResponse response) {

        String path = request.getURI().getPath();
        if (path.contains("/api-docs") || path.contains("/swagger") || path.contains("/v3/api-docs")) {
            return body;
        }

        if (body instanceof ApiResponse) {
            return body;
        }

        return ApiResponse.ok(body);
    }
}
