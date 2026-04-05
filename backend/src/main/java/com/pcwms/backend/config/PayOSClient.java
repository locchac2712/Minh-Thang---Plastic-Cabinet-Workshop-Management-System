package com.pcwms.backend.config;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.*;


@Slf4j
@Component
@RequiredArgsConstructor
public class PayOSClient {

    @Value("${payos.client-id}")
    private String clientId;

    @Value("${payos.api-key}")
    private String apiKey;

    @Value("${payos.checksum-key}")
    private String checksumKey;

    private static final String BASE_URL = "https://api-merchant.payos.vn";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    // ── 1. Tạo link thanh toán ───────────────────────────────
    public CreateLinkResponse createPaymentLink(CreateLinkRequest req) throws Exception {
        // Tạo signature: amount + cancelUrl + description + orderCode + returnUrl
        String signData = String.format(
                "amount=%d&cancelUrl=%s&description=%s&orderCode=%d&returnUrl=%s",
                req.getAmount(), req.getCancelUrl(), req.getDescription(),
                req.getOrderCode(), req.getReturnUrl()
        );
        req.setSignature(hmacSHA256(signData, checksumKey));

        String body     = objectMapper.writeValueAsString(req);
        String respBody = post("/v2/payment-requests", body);

        PayOSResponse<CreateLinkResponse> resp = objectMapper.readValue(
                respBody,
                objectMapper.getTypeFactory().constructParametricType(PayOSResponse.class, CreateLinkResponse.class)
        );

        if (!"00".equals(resp.getCode())) {
            throw new RuntimeException("PayOS createPaymentLink failed: " + resp.getDesc());
        }
        return resp.getData();
    }

    // ── 2. Lấy trạng thái link ──────────────────────────────
    public PaymentStatusResponse getPaymentLinkInfo(Long orderCode) throws Exception {
        String respBody = get("/v2/payment-requests/" + orderCode);

        PayOSResponse<PaymentStatusResponse> resp = objectMapper.readValue(
                respBody,
                objectMapper.getTypeFactory().constructParametricType(PayOSResponse.class, PaymentStatusResponse.class)
        );

        if (!"00".equals(resp.getCode())) {
            throw new RuntimeException("PayOS getPaymentLinkInfo failed: " + resp.getDesc());
        }
        return resp.getData();
    }

    // ── 3. Huỷ link thanh toán ──────────────────────────────
    public void cancelPaymentLink(Long orderCode, String reason) throws Exception {
        Map<String, String> body = Map.of("cancellationReason", reason);
        String respBody = put("/v2/payment-requests/" + orderCode + "/cancel",
                objectMapper.writeValueAsString(body));

        PayOSResponse<?> resp = objectMapper.readValue(respBody, PayOSResponse.class);
        if (!"00".equals(resp.getCode())) {
            throw new RuntimeException("PayOS cancelPaymentLink failed: " + resp.getDesc());
        }
    }

    // ── 4. Verify webhook signature ─────────────────────────
    public boolean verifyWebhookSignature(WebhookData data, String receivedSignature) {
        try {
            // Các field cần sort theo alphabet để tạo signData
            TreeMap<String, String> fields = new TreeMap<>();
            fields.put("amount",                  String.valueOf(data.getAmount()));
            fields.put("description",             nvl(data.getDescription()));
            fields.put("orderCode",               String.valueOf(data.getOrderCode()));
            fields.put("reference",               nvl(data.getReference()));
            fields.put("transactionDateTime",     nvl(data.getTransactionDateTime()));
            fields.put("paymentLinkId",           nvl(data.getPaymentLinkId()));
            fields.put("code",                    nvl(data.getCode()));
            fields.put("desc",                    nvl(data.getDesc()));
            fields.put("counterAccountBankId",    nvl(data.getCounterAccountBankId()));
            fields.put("counterAccountBankName",  nvl(data.getCounterAccountBankName()));
            fields.put("counterAccountName",      nvl(data.getCounterAccountName()));
            fields.put("counterAccountNumber",    nvl(data.getCounterAccountNumber()));
            fields.put("virtualAccountName",      nvl(data.getVirtualAccountName()));
            fields.put("virtualAccountNumber",    nvl(data.getVirtualAccountNumber()));
            fields.put("currency",                nvl(data.getCurrency()));

            StringBuilder sb = new StringBuilder();
            fields.forEach((k, v) -> sb.append(k).append("=").append(v).append("&"));
            String signData = sb.substring(0, sb.length() - 1); // bỏ & cuối

            String expected = hmacSHA256(signData, checksumKey);
            return expected.equals(receivedSignature);
        } catch (Exception e) {
            log.error("Webhook signature verify error: {}", e.getMessage());
            return false;
        }
    }

    // ── HTTP helpers ─────────────────────────────────────────

    private HttpHeaders getHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-client-id", clientId);
        headers.set("x-api-key", apiKey);
        return headers;
    }

    private String post(String path, String body) {
        HttpEntity<String> entity = new HttpEntity<>(body, getHeaders());
        return restTemplate.exchange(BASE_URL + path, HttpMethod.POST, entity, String.class).getBody();
    }

    private String get(String path) {
        HttpEntity<Void> entity = new HttpEntity<>(getHeaders());
        return restTemplate.exchange(BASE_URL + path, HttpMethod.GET, entity, String.class).getBody();
    }

    private String put(String path, String body) {
        HttpEntity<String> entity = new HttpEntity<>(body, getHeaders());
        return restTemplate.exchange(BASE_URL + path, HttpMethod.PUT, entity, String.class).getBody();
    }

    private String hmacSHA256(String data, String key) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    private String nvl(String s) { return s != null ? s : ""; }

    // ── Inner DTOs ────────────────────────────────────────────

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PayOSResponse<T> {
        private String code;
        private String desc;
        private T      data;
    }

    @Data
    public static class CreateLinkRequest {
        private Long         orderCode;
        private Integer      amount;
        private String       description;
        private String       buyerName;
        private String       returnUrl;
        private String       cancelUrl;
        private List<Item>   items;
        private String       signature;

        @Data
        public static class Item {
            private String  name;
            private Integer quantity;
            private Integer price;
        }
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)   // ← bỏ qua expiredAt và field lạ bất kỳ
    public static class CreateLinkResponse {
        private String  bin;
        private String  accountNumber;
        private String  accountName;
        private Integer amount;
        private String  description;
        private Long    orderCode;
        private String  currency;
        private String  paymentLinkId;
        private String  status;
        private String  checkoutUrl;
        private String  qrCode;
        private String  expiredAt;   // field mới của PayOS API
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PaymentStatusResponse {
        private String  status;      // PENDING | PAID | CANCELLED | EXPIRED
        private Long    amount;
        private Long    orderCode;
        private String  paymentLinkId;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class WebhookData {
        private Long   orderCode;
        private Long   amount;
        private String description;
        private String accountNumber;
        private String reference;
        private String transactionDateTime;
        private String currency;
        private String paymentLinkId;
        private String code;
        private String desc;
        private String counterAccountBankId;
        private String counterAccountBankName;
        private String counterAccountName;
        private String counterAccountNumber;
        private String virtualAccountName;
        private String virtualAccountNumber;
    }
}
