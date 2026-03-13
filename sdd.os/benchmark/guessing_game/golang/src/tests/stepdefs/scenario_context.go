package stepdefs

import (
	"github.com/gavv/httpexpect/v2"
	"gorm.io/gorm"
)

// ScenarioContext holds the context for a scenario
type ScenarioContext struct {
	LastResponse *httpexpect.Response
	DB           *gorm.DB
}

// NewScenarioContext creates a new scenario context
func NewScenarioContext(db *gorm.DB) *ScenarioContext {
	return &ScenarioContext{
		DB: db,
	}
}