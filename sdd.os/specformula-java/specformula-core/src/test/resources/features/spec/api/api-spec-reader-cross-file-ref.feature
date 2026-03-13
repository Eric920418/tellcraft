Feature: API Spec Reader - 跨檔案 $ref 解析
  ApiSpecReader 支援跨檔案 $ref 解析，
  可引用其他 YAML 檔案中定義的 components。

  Scenario: response schema 引用另一個檔案的 schema
    Given spec.api 目標路徑下存在檔案 "common.yml":
      """yaml
      components:
        schemas:
          ErrorResponse:
            type: object
            properties:
              code:
                type: integer
              message:
                type: string
      """
    And spec.api 目標路徑下存在檔案 "api.yml":
      """yaml
      openapi: "3.0.0"
      info:
        title: Test API
        version: "1.0.0"
      paths:
        /users:
          get:
            summary: List users
            responses:
              "200":
                description: Success
              "500":
                description: Internal Server Error
                content:
                  application/json:
                    schema:
                      $ref: 'common.yml#/components/schemas/ErrorResponse'
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
            "parameters": null,
            "requestBody": null,
            "responses": {
              "200": {
                "statusCode": "200",
                "description": "Success",
                "schema": null
              },
              "500": {
                "statusCode": "500",
                "description": "Internal Server Error",
                "schema": {
                  "type": "object",
                  "format": null,
                  "description": null,
                  "required": null,
                  "properties": {
                    "code": {
                      "type": "integer",
                      "format": null,
                      "description": null,
                      "required": null,
                      "properties": null,
                      "items": null,
                      "enumValues": null,
                      "example": null
                    },
                    "message": {
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
              }
            }
          }
        ]
      }
      """
