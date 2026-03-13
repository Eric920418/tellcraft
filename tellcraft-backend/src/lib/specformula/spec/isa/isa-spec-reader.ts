import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import type { IsaSpec, IsaInstruction, IsaConfig } from './models';

const VALID_TIME_FORMATS = new Set(['iso', 'timestamp', 'epoch', 'date_only', 'time_only']);
const VALID_DB_TYPES = new Set(['postgresql', 'postgres']);
const VALID_PERMISSIONS = new Set(['isolated', 'shared']);
const VALID_INSTRUCTION_TYPES = new Set([
  'time_control', 'entity_setup', 'api_call', 'response_validate',
  'entity_validate', 'entity_non_existence_validate', 'custom'
]);
const ENTITY_INSTRUCTION_TYPES = new Set([
  'entity_setup', 'entity_validate', 'entity_non_existence_validate'
]);
const API_INSTRUCTION_TYPES = new Set(['api_call', 'response_validate']);
const VALID_DATA_FORMATS = new Set(['data_table', 'json']);

export class IsaSpecReader {
  private readonly resourcePath: string;

  constructor(resourcePath = 'isa.yml') {
    this.resourcePath = resourcePath;
  }

  read(): IsaSpec {
    const resolvedPath = path.resolve(this.resourcePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`isa.yml not found at: ${resolvedPath}`);
    }

    const content = fs.readFileSync(resolvedPath, 'utf-8');
    const spec = yaml.load(content) as IsaSpec;
    this.applyDefaults(spec);
    this.validate(spec);
    return spec;
  }

  private applyDefaults(spec: IsaSpec): void {
    const config = spec.config;
    if (!config) return;

    if (config.api && !config.api.time_format) {
      config.api.time_format = 'iso';
    }
    if (config.data) {
      if (!config.data.permission) {
        config.data.permission = 'isolated';
      }
      if (config.data.source) {
        for (const source of config.data.source) {
          if (!source.db_type) {
            source.db_type = 'postgresql';
          }
        }
      }
    }
  }

  private validate(spec: IsaSpec): void {
    const config: IsaConfig = spec.config;
    if (!config) {
      throw new Error("isa.yml must contain a 'config' section");
    }
    if (!config.api) {
      throw new Error("config must contain 'api'");
    }
    if (!config.api.resource_path) {
      throw new Error('config.api.resource_path is required');
    }
    if (!config.api.project_path) {
      throw new Error('config.api.project_path is required');
    }
    if (!VALID_TIME_FORMATS.has(config.api.time_format!)) {
      throw new Error(`config.api.time_format must be one of ${[...VALID_TIME_FORMATS]} but got: ${config.api.time_format}`);
    }
    if (!config.data) {
      throw new Error("config must contain 'data'");
    }
    if (!VALID_PERMISSIONS.has(config.data.permission!)) {
      throw new Error(`config.data.permission must be one of ${[...VALID_PERMISSIONS]} but got: ${config.data.permission}`);
    }
    if (!config.data.source || config.data.source.length === 0) {
      throw new Error('config.data.source must not be empty');
    }

    const seenNames = new Set<string>();
    for (const source of config.data.source) {
      if (!source.name) {
        throw new Error('config.data.source[].name is required');
      }
      if (seenNames.has(source.name)) {
        throw new Error(`config.data.source[].name must be unique, duplicate: ${source.name}`);
      }
      seenNames.add(source.name);
      if (!source.resource_path) {
        throw new Error(`config.data.source['${source.name}'].resource_path is required`);
      }
      if (!source.project_path) {
        throw new Error(`config.data.source['${source.name}'].project_path is required`);
      }
      if (!VALID_DB_TYPES.has(source.db_type!)) {
        throw new Error(`config.data.source['${source.name}'].db_type must be one of ${[...VALID_DB_TYPES]} but got: ${source.db_type}`);
      }
    }

    if (!spec.instructions) return;
    for (const instruction of spec.instructions) {
      this.validateInstruction(instruction);
    }
  }

  private validateInstruction(instruction: IsaInstruction): void {
    const type = instruction.instruction_type;
    if (!type || !VALID_INSTRUCTION_TYPES.has(type)) {
      throw new Error(`Unknown instruction_type: ${type} in instruction: ${instruction.name}`);
    }

    // Accept both Python (?P<name>...) and JS (?<name>...) named group syntax
    const hasNamedGroup = (format: string, name: string): boolean =>
      format.includes(`(?P<${name}>`) || format.includes(`(?<${name}>`);

    if (ENTITY_INSTRUCTION_TYPES.has(type) &&
        (!instruction.format || !hasNamedGroup(instruction.format, 'entity'))) {
      throw new Error(
        `instruction_type '${type}' requires (?<entity>...) in format, but instruction '${instruction.name}' is missing it`
      );
    }

    if (API_INSTRUCTION_TYPES.has(type) &&
        (!instruction.format || !hasNamedGroup(instruction.format, 'summary'))) {
      throw new Error(
        `instruction_type '${type}' requires (?<summary>...) in format, but instruction '${instruction.name}' is missing it`
      );
    }

    if (type === 'response_validate') {
      if (instruction.format && !hasNamedGroup(instruction.format, 'status_code')) {
        throw new Error(
          `instruction_type 'response_validate' requires (?<status_code>...) in format, but instruction '${instruction.name}' is missing it`
        );
      }
      if (!instruction.data_format || !VALID_DATA_FORMATS.has(instruction.data_format)) {
        throw new Error(
          `instruction_type 'response_validate' requires data_format to be one of ${[...VALID_DATA_FORMATS]} but instruction '${instruction.name}' has: ${instruction.data_format}`
        );
      }
    }
  }
}
