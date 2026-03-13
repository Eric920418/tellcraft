# Tech Stack

## 語言環境
- Go 1.25+ (建議使用最新穩定版本)
- Go Modules (內建依賴管理工具)

## 函式庫/工具 (語言環境內)
- encoding/json (標準函式庫 - JSON 處理)
- go-playground/validator/v10 (資料驗證)
- golang.org/x/sync (並行控制)
- github.com/google/uuid (UUID 產生)

## Web 框架
- Gin (github.com/gin-gonic/gin) - 高效能 HTTP 框架

## ORM / 資料庫
- SQLite (嵌入式資料庫 - github.com/mattn/go-sqlite3)
- GORM (gorm.io/gorm) - 功能完整的 ORM

## 測試環境
- testing (標準函式庫 - 單元測試)
- testify (github.com/stretchr/testify) - 斷言與 Mock 工具
- httpexpect (github.com/gavv/httpexpect/v2) - Http client 套件
- godog (github.com/cucumber/godog) - BDD 測試框架, Cucumber for golang
- SQLite (記憶體模式用於測試)

## 額外推薦工具
- zap (go.uber.org/zap) - 高效能日誌函式庫
- viper (github.com/spf13/viper) - 組態管理
- air (github.com/cosmtrek/air) - 熱重載開發工具