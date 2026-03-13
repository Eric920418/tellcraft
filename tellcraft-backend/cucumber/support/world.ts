import { World, setWorldConstructor } from '@cucumber/cucumber';
import { ScenarioContext } from '../../src/lib/specformula/context/scenario-context';

/**
 * Custom Cucumber World holding the ScenarioContext.
 * Each scenario gets a fresh World instance automatically.
 */
export class SpecFormulaWorld extends World {
  public scenarioContext: ScenarioContext = new ScenarioContext();
}

setWorldConstructor(SpecFormulaWorld);
