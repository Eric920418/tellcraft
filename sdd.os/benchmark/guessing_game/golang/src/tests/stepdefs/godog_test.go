package stepdefs

import (
	"testing"

	"github.com/cucumber/godog"
)

var globalT *testing.T

func TestFeatures(t *testing.T) {
	globalT = t // Set the global t
	suite := godog.TestSuite{
		ScenarioInitializer: InitializeScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{"{{ features_path }}"},
			TestingT: t,
		},
	}

	suite.Run()
}

func InitializeScenario(sc *godog.ScenarioContext) {
	panic("not implemented")
}
