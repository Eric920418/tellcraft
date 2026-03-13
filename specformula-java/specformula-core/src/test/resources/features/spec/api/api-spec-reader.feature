Feature: API Spec Reader - 讀取單一 API spec 檔案
  ApiSpecReader 負責讀取 OpenAPI YAML 檔案，解析為 ApiSpec 物件。
  支援 GET、POST、PUT、DELETE、PATCH 等 HTTP 方法，
  包含 parameters、requestBody、responses、enum 等完整解析。

  Scenario: 解析包含一個 GET 端點的 API spec
    Given spec.api 目標路徑下存在檔案 "api.yml":
      """yaml
      openapi: "3.0.0"
      info:
        title: Test API
        version: "1.0.0"
      paths:
        /hello:
          get:
            summary: Say hello
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
          "title": "Test API",
          "version": "1.0.0",
          "description": null
        },
        "operations": [
          {
            "method": "get",
            "path": "/hello",
            "summary": "Say hello",
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

  Scenario: 解析包含 POST 及 requestBody 的端點
    Given spec.api 目標路徑下存在檔案 "api.yml":
      """yaml
      openapi: "3.0.0"
      info:
        title: Test API
        version: "1.0.0"
      paths:
        /users:
          post:
            summary: Create user
            requestBody:
              required: true
              content:
                application/json:
                  schema:
                    type: object
                    required:
                      - name
                    properties:
                      name:
                        type: string
                      email:
                        type: string
            responses:
              "201":
                description: Created
      """
    When spec.api 讀取 API spec
    Then spec.api ApiSpec 的解析結果為:
      """json
      {
        "openapi": "3.0.0",
        "info": {
          "title": "Test API",
          "version": "1.0.0",
          "description": null
        },
        "operations": [
          {
            "method": "post",
            "path": "/users",
            "summary": "Create user",
            "description": null,
            "operationId": null,
            "tags": null,
            "parameters": null,
            "requestBody": {
              "required": true,
              "schema": {
                "type": "object",
                "format": null,
                "description": null,
                "required": ["name"],
                "properties": {
                  "name": {
                    "type": "string",
                    "format": null,
                    "description": null,
                    "required": null,
                    "properties": null,
                    "items": null,
                    "enumValues": null,
                    "example": null
                  },
                  "email": {
                    "type": "string",
                    "format": null,
                    "description": null,
                    "required": null,
                    "properties": null,
                    "items": null,
                    "enumValues": null,
                    "example": null
                  }
                },
                "items": null,
                "enumValues": null,
                "example": null
              }
            },
            "responses": {
              "201": {
                "statusCode": "201",
                "description": "Created",
                "schema": null
              }
            }
          }
        ]
      }
      """

  Scenario: 解析包含 parameters 的端點
    Given spec.api 目標路徑下存在檔案 "api.yml":
      """yaml
      openapi: "3.0.0"
      info:
        title: Test API
        version: "1.0.0"
      paths:
        /users:
          get:
            summary: List users
            parameters:
              - name: page
                in: query
                required: false
                schema:
                  type: integer
              - name: size
                in: query
                required: false
                schema:
                  type: integer
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
          "title": "Test API",
          "version": "1.0.0",
          "description": null
        },
        "operations": [
          {
            "method": "get",
            "path": "/users",
            "summary": "List users",
            "description": null,
            "operationId": null,
            "tags": null,
            "parameters": [
              {
                "name": "page",
                "in": "query",
                "required": false,
                "schema": {
                  "type": "integer",
                  "format": null,
                  "description": null,
                  "required": null,
                  "properties": null,
                  "items": null,
                  "enumValues": null,
                  "example": null
                },
                "description": null
              },
              {
                "name": "size",
                "in": "query",
                "required": false,
                "schema": {
                  "type": "integer",
                  "format": null,
                  "description": null,
                  "required": null,
                  "properties": null,
                  "items": null,
                  "enumValues": null,
                  "example": null
                },
                "description": null
              }
            ],
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

  Scenario: 解析包含 enum 的端點
    Given spec.api 目標路徑下存在檔案 "api.yml":
      """yaml
      openapi: "3.0.0"
      info:
        title: Test API
        version: "1.0.0"
      paths:
        /items:
          get:
            summary: List items
            parameters:
              - name: status
                in: query
                required: false
                schema:
                  type: string
                  enum:
                    - active
                    - inactive
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
          "title": "Test API",
          "version": "1.0.0",
          "description": null
        },
        "operations": [
          {
            "method": "get",
            "path": "/items",
            "summary": "List items",
            "description": null,
            "operationId": null,
            "tags": null,
            "parameters": [
              {
                "name": "status",
                "in": "query",
                "required": false,
                "schema": {
                  "type": "string",
                  "format": null,
                  "description": null,
                  "required": null,
                  "properties": null,
                  "items": null,
                  "enumValues": ["active", "inactive"],
                  "example": null
                },
                "description": null
              }
            ],
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

  Scenario: 單一檔案內 operation summary 重複應報錯
    Given spec.api 目標路徑下存在檔案 "api.yml":
      """yaml
      openapi: "3.0.0"
      info:
        title: Test API
        version: "1.0.0"
      paths:
        /hello:
          get:
            summary: Say hello
            responses:
              "200":
                description: Success
        /greeting:
          get:
            summary: Say hello
            responses:
              "200":
                description: Success
      """
    When spec.api 讀取 API spec
    Then spec.api 解析應拋出例外訊息包含 "Duplicate API operation summary: Say hello"

  Scenario: 目標路徑是空目錄
    Given spec.api 目標路徑是空目錄
    When spec.api 讀取 API spec
    Then spec.api 解析應拋出例外訊息包含 "No API spec files found in:"
