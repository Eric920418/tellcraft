import type { IsaInstruction } from '../spec/isa/models';
import type { InstructionSet } from './step-definition-factory';

type DataTable = { raw: () => string[][]; hashes: () => Record<string, string>[] };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StepFn = (pattern: string | RegExp, fn: (...args: any[]) => Promise<void> | void) => void;

/**
 * Register Cucumber.js step definitions from ISA instructions.
 *
 * Given/When/Then functions are injected to avoid direct @cucumber/cucumber dependency
 * at module load time (enables testing without Cucumber runtime).
 */
export function registerSteps(
  instructions: IsaInstruction[],
  instructionSet: InstructionSet,
  Given: StepFn,
  When: StepFn,
  Then: StepFn
): void {
  for (const instruction of instructions) {
    // Convert Python named groups (?P<name>...) to JS (?<name>...)
    const jsPattern = instruction.format.replace(/\(\?P</g, '(?<');
    const regex = new RegExp(jsPattern);

    switch (instruction.instruction_type) {
      case 'time_control':
        Given(regex, async (timeString: unknown) => {
          instructionSet.timeControl.setTime(String(timeString));
        });
        break;

      case 'entity_setup':
        Given(regex, async (entityName: unknown, dataTable: DataTable) => {
          const headers = dataTable.raw()[0];
          const rows = dataTable.hashes();
          await instructionSet.entitySetup.setup(String(entityName), headers, rows);
        });
        break;

      case 'api_call':
        // Regex has 2 captured groups: actor (optional), summary
        // Cucumber.js checks function.length, so we CANNOT use ...args (length=0)
        // Use explicit params: actorSpec, summary, dataTable
        When(regex, async (actorSpec: unknown, summary: unknown, dataTable: DataTable) => {
          const headers = dataTable.raw()[0];
          const rows = dataTable.hashes();
          const summaryStr = String(summary);

          if (actorSpec && String(actorSpec) !== 'No Actor') {
            const uidMatch = /UID="([^"]+)"/.exec(String(actorSpec));
            if (uidMatch) {
              const uidVar = uidMatch[1];
              const resolvedUid = instructionSet.apiCall['resolver'].resolveVariable(uidVar);
              await instructionSet.apiCall.invokeWithActor(
                headers, rows, summaryStr,
                async () => String(resolvedUid)
              );
            } else {
              await instructionSet.apiCall.invokeWithoutActor(headers, rows, summaryStr);
            }
          } else {
            await instructionSet.apiCall.invokeWithoutActor(headers, rows, summaryStr);
          }
        });
        break;

      case 'response_validate':
        if (instruction.data_format === 'json') {
          Then(regex, async (summary: unknown, statusCode: unknown, docString: unknown) => {
            instructionSet.jsonResponseValidate.validate(
              String(summary), String(statusCode), docString as string | null
            );
          });
        } else {
          // data_table (default)
          Then(regex, async (summary: unknown, statusCode: unknown, dataTable: unknown) => {
            const dt = dataTable as DataTable | null;
            const headers = dt ? dt.raw()[0] : null;
            const rows = dt ? dt.hashes() : null;
            instructionSet.dataTableResponseValidate.validate(
              String(summary), String(statusCode), headers, rows
            );
          });
        }
        break;

      case 'entity_validate':
        Then(regex, async (entityName: unknown, dataTable: DataTable) => {
          const headers = dataTable.raw()[0];
          const rows = dataTable.hashes();
          await instructionSet.entityValidate.assertExists(String(entityName), headers, rows);
        });
        break;

      case 'entity_non_existence_validate':
        Then(regex, async (entityName: unknown, dataTable: DataTable) => {
          const rows = dataTable.hashes();
          await instructionSet.entityNonExistenceValidate.assertNotExists(String(entityName), rows);
        });
        break;

      case 'custom':
        // Custom instructions are handled by user-defined step definitions
        break;

      default:
        console.warn(
          `[SpecFormula] Unknown instruction_type: ${instruction.instruction_type} for instruction: ${instruction.name}`
        );
    }
  }
}
