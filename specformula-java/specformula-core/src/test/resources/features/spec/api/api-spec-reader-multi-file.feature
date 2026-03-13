Feature: API Spec Reader - 讀取多個 API spec 檔案
  ApiSpecReader 支援讀取目標路徑中的多個 YAML 檔案，
  依照檔名排序，合併為單一 ApiSpec 物件。

  Scenario: 讀取兩個 API spec 檔案
    Given spec.api 目標路徑下存在檔案 "auth-api.yml":
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
    And spec.api 目標路徑下存在檔案 "user-api.yml":
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

  Scenario: 多個檔案間 operation summary 重複應報錯
    Given spec.api 目標路徑下存在檔案 "a-api.yml":
      """yaml
      openapi: "3.0.0"
      info:
        title: A API
        version: "1.0.0"
      paths:
        /hello:
          get:
            summary: Say hello
            responses:
              "200":
                description: Success
      """
    And spec.api 目標路徑下存在檔案 "b-api.yml":
      """yaml
      openapi: "3.0.0"
      info:
        title: B API
        version: "1.0.0"
      paths:
        /greeting:
          get:
            summary: Say hello
            responses:
              "200":
                description: Success
      """
    When spec.api 讀取 API spec
    Then spec.api 解析應拋出例外訊息包含 "Duplicate API operation summary: Say hello"
