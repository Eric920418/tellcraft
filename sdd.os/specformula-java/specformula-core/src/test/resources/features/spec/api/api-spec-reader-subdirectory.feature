Feature: API Spec Reader - 遞迴讀取子目錄
  ApiSpecReader 支援遞迴掃描目標路徑及其子目錄，
  讀取所有 YAML 檔案並依路徑排序，合併為單一 ApiSpec 物件。

  Scenario: 讀取目標路徑及子目錄的所有 API spec
    Given spec.api 目標路徑下存在檔案 "root-api.yml":
      """yaml
      openapi: "3.0.0"
      info:
        title: Root API
        version: "1.0.0"
      paths:
        /health:
          get:
            summary: Health check
            responses:
              "200":
                description: OK
      """
    And spec.api 目標路徑下存在檔案 "auth/auth-api.yml":
      """yaml
      openapi: "3.0.0"
      info:
        title: Auth API
        version: "1.0.0"
      paths:
        /login:
          post:
            summary: Login
            responses:
              "200":
                description: Success
      """
    And spec.api 目標路徑下存在檔案 "user/user-api.yml":
      """yaml
      openapi: "3.0.0"
      info:
        title: User API
        version: "1.0.0"
      paths:
        /users:
          get:
            summary: List users
            responses:
              "200":
                description: Success
      """
    When spec.api 讀取 API spec
    Then spec.api ApiSpec 的解析結果為:
      """json
      {
        "openapi": "3.0.0",
        "info": {
          "title": "Auth API",
          "version": "1.0.0",
          "description": null
        },
        "operations": [
          {
            "method": "post",
            "path": "/login",
            "summary": "Login",
            "description": null,
            "operationId": null,
            "tags": null,
            "parameters": null,
            "requestBody": null,
            "responses": {
              "200": {
                "statusCode": "200",
                "description": "Success",
                "schema": null
              }
            }
          },
          {
            "method": "get",
            "path": "/health",
            "summary": "Health check",
            "description": null,
            "operationId": null,
            "tags": null,
            "parameters": null,
            "requestBody": null,
            "responses": {
              "200": {
                "statusCode": "200",
                "description": "OK",
                "schema": null
              }
            }
          },
          {
            "method": "get",
            "path": "/users",
            "summary": "List users",
            "description": null,
            "operationId": null,
            "tags": null,
            "parameters": null,
            "requestBody": null,
            "responses": {
              "200": {
                "statusCode": "200",
                "description": "Success",
                "schema": null
              }
            }
          }
        ]
      }
      """

  Scenario: 子目錄間 operation summary 重複應報錯
    Given spec.api 目標路徑下存在檔案 "auth/auth-api.yml":
      """yaml
      openapi: "3.0.0"
      info:
        title: Auth API
        version: "1.0.0"
      paths:
        /login:
          post:
            summary: Login
            responses:
              "200":
                description: Success
      """
    And spec.api 目標路徑下存在檔案 "user/user-api.yml":
      """yaml
      openapi: "3.0.0"
      info:
        title: User API
        version: "1.0.0"
      paths:
        /signin:
          post:
            summary: Login
            responses:
              "200":
                description: Success
      """
    When spec.api 讀取 API spec
    Then spec.api 解析應拋出例外訊息包含 "Duplicate API operation summary: Login"
