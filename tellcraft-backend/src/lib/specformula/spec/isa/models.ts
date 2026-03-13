export interface IsaSpec {
  config: IsaConfig;
  instructions: IsaInstruction[];
}

export interface IsaConfig {
  api: IsaApiConfig;
  data: IsaDataConfig;
}

export interface IsaApiConfig {
  resource_path: string;
  project_path: string;
  time_format?: string; // default: 'iso'
}

export interface IsaDataConfig {
  permission?: string; // 'isolated' | 'shared', default: 'isolated'
  reuse?: boolean;
  source: IsaDataSourceConfig[];
}

export interface IsaDataSourceConfig {
  name: string;
  resource_path: string;
  project_path: string;
  db_type?: string; // default: 'postgresql' (only PG supported in TS port)
}

export interface IsaInstruction {
  name: string;
  format: string; // regex pattern
  instruction_type: string;
  data_format?: string; // 'data_table' | 'json'
}
