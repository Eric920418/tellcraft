Feature: API Spec Reader - 本地 $ref 解析
  ApiSpecReader 支援解析本地 $ref 參照，
  正確解析 #/components/parameters 與 #/components/schemas 的參照。

  Scenario: parameter 使用 $ref
    Given spec.api 目標路徑下存在檔案 "api.yml":
      """yaml
      openapi: "3.0.0"
      info:
        title: Test API
        version: "1.0.0"
      paths:
        /users/{id}:
          get:
            summary: Get user by ID
            parameters:
              - $ref: '#/components/parameters/IdParam'
            responses:
              "200":
                description: Success
      components:
        parameters:
          IdParam:
            name: id
            in: path
            required: true
            schema:
              type: integer
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
            "path": "/users/{id}",
            "summary": "Get user by ID",
            "description": null,
            "operationId": null,
            "tags": null,
            "parameters": [
              {
                "name": "id",
                "in": "path",
                "required": true,
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

  Scenario: requestBody schema 使用 $ref
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
                    $ref: '#/components/schemas/UserInput'
            responses:
              "201":
                description: Created
      components:
        schemas:
          UserInput:
            type: object
            required:
              - name
            properties:
              name:
                type: string
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
