package com.moodcast.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@CrossOrigin(
        origins = {"http://localhost:5173", "http://127.0.0.1:5173"},
        allowedHeaders = "*",
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS},
        allowCredentials = "true"
)
@RequestMapping("/upload")
public class FileUploadController {

    // application.yml의 app.upload-dir 값, 기본값은 실행 디렉토리 하위 uploads/
    @Value("${app.upload-dir:uploads}")
    private String uploadDirConfig;

    /**
     * OS에 관계없이 절대 경로를 반환합니다.
     * Mac/Linux: /path/to/project/uploads
     * Windows:   C:/Users/username/uploads
     */
    private Path getUploadPath() throws IOException {
        Path path;
        if (Paths.get(uploadDirConfig).isAbsolute()) {
            path = Paths.get(uploadDirConfig);
        } else {
            // 상대 경로면 JAR 실행 디렉토리 기준
            path = Paths.get(System.getProperty("user.dir"), uploadDirConfig);
        }
        Files.createDirectories(path); // 없으면 자동 생성
        return path;
    }

    @PostMapping
    public ResponseEntity<?> upload(
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "X-Base-Url", required = false) String baseUrl
    ) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "파일이 비어있습니다."));
        }

        // 허용 MIME 타입 제한
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("error", "이미지 파일만 업로드 가능합니다."));
        }

        try {
            Path uploadPath = getUploadPath();

            // 원본 파일명에서 확장자만 추출
            String original = file.getOriginalFilename();
            String ext = "";
            if (original != null && original.contains(".")) {
                ext = original.substring(original.lastIndexOf('.'));
            }

            // UUID로 고유한 파일명 생성 (OS 경로 문자 문제 방지)
            String filename = UUID.randomUUID().toString() + ext;
            Path target = uploadPath.resolve(filename);

            // 파일 저장 (NIO Path 사용, Mac/Windows 모두 동작)
            Files.copy(file.getInputStream(), target, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            // 접근 URL 구성
            // 프론트에서 X-Base-Url 헤더를 보내지 않으면 기본값 사용
            String serverBase = (baseUrl != null && !baseUrl.isBlank())
                    ? baseUrl
                    : "http://localhost:8080";

            String url = serverBase + "/uploads/" + filename;
            return ResponseEntity.ok(Map.of("url", url, "filename", filename));

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "파일 저장에 실패했습니다: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{filename}")
    public ResponseEntity<?> delete(@PathVariable String filename) {
        // 파일명에 /, \\ 또는 .. 같은 문자가 들어가면 안 됩니다.
        if (filename.contains("/") || filename.contains("\\") || filename.contains("..")) {
            return ResponseEntity.badRequest().body(Map.of("error", "잘못된 파일명입니다."));
        }
        try {
            Path file = getUploadPath().resolve(filename);
            boolean deleted = Files.deleteIfExists(file);
            return ResponseEntity.ok(Map.of("deleted", deleted));
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "파일 삭제에 실패했습니다."));
        }
    }
}
