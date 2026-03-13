import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import type {
  ApiSpec, ApiOperation, ApiParameter, ApiRequestBody,
  ApiResponse, ApiSchema, ApiInfo
} from './models';
import type { IsaApiConfig } from '../isa/models';

const HTTP_METHODS = new Set(['get', 'post', 'put', 'delete', 'patch']);

export class ApiSpecReader {
  private readonly resourcePath: string;

  constructor(apiConfig: IsaApiConfig) {
    this.resourcePath = apiConfig.resource_path;
  }

  read(): ApiSpec {
    const dirPath = path.resolve(this.resourcePath);
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      throw new Error(`API spec directory not found: ${dirPath}`);
    }
    return this.scanDirectory(dirPath);
  }

  readFromString(content: string): ApiSpec {
    const root = yaml.load(content) as Record<string, unknown>;
    return this.parseSpec(root, new Map());
  }

  private scanDirectory(dirPath: string): ApiSpec {
    const entries = fs.readdirSync(dirPath).filter(f => f.endsWith('.yml')).sort();
    if (entries.length === 0) {
      throw new Error(`No API spec files found in: ${dirPath}`);
    }

    const allRoots = new Map<string, Record<string, unknown>>();
    for (const entry of entries) {
      const content = fs.readFileSync(path.join(dirPath, entry), 'utf-8');
      allRoots.set(entry, yaml.load(content) as Record<string, unknown>);
    }

    let merged: ApiSpec | null = null;
    for (const [, root] of allRoots) {
      const spec = this.parseSpec(root, allRoots);
      if (!merged) {
        merged = spec;
      } else {
        merged.operations.push(...spec.operations);
      }
    }

    return merged!;
  }

  private parseSpec(root: Record<string, unknown>, allRoots: Map<string, Record<string, unknown>>): ApiSpec {
    const spec: ApiSpec = {
      openapi: root.openapi as string | undefined,
      operations: []
    };

    const infoNode = root.info as Record<string, unknown> | undefined;
    if (infoNode) {
      spec.info = {
        title: infoNode.title as string | undefined,
        version: infoNode.version as string | undefined,
        description: infoNode.description as string | undefined,
      };
    }

    const pathsNode = root.paths as Record<string, Record<string, unknown>> | undefined;
    if (pathsNode) {
      for (const [pathUrl, pathNode] of Object.entries(pathsNode)) {
        for (const [method, opNode] of Object.entries(pathNode)) {
          if (!HTTP_METHODS.has(method.toLowerCase())) continue;
          const op = this.parseOperation(
            pathUrl, method.toLowerCase(),
            opNode as Record<string, unknown>,
            root, allRoots
          );
          spec.operations.push(op);
        }
      }
    }

    return spec;
  }

  private parseOperation(
    pathUrl: string, method: string,
    opNode: Record<string, unknown>,
    root: Record<string, unknown>,
    allRoots: Map<string, Record<string, unknown>>
  ): ApiOperation {
    const op: ApiOperation = {
      path: pathUrl,
      method,
      summary: opNode.summary as string | undefined,
      description: opNode.description as string | undefined,
      operationId: opNode.operationId as string | undefined,
    };

    const tagsNode = opNode.tags as string[] | undefined;
    if (tagsNode) op.tags = tagsNode;

    // Parameters
    const paramsNode = opNode.parameters as Record<string, unknown>[] | undefined;
    if (paramsNode) {
      op.parameters = paramsNode.map(paramNode => {
        const resolved = this.resolveRef(paramNode, root, allRoots);
        const param: ApiParameter = {
          name: resolved.name as string,
          in: resolved.in as string,
          required: !!resolved.required,
          description: resolved.description as string | undefined,
        };
        if (resolved.schema) {
          param.schema = this.parseSchema(resolved.schema as Record<string, unknown>, root, allRoots);
        }
        return param;
      });
    }

    // RequestBody
    const reqBodyNode = opNode.requestBody as Record<string, unknown> | undefined;
    if (reqBodyNode) {
      const reqBody: ApiRequestBody = {
        required: !!reqBodyNode.required,
      };
      const contentSchema = this.extractJsonSchema(reqBodyNode);
      if (contentSchema) {
        const resolved = this.resolveRef(contentSchema, root, allRoots);
        reqBody.schema = this.parseSchema(resolved, root, allRoots);
      }
      op.requestBody = reqBody;
    }

    // Responses
    const responsesNode = opNode.responses as Record<string, Record<string, unknown>> | undefined;
    if (responsesNode) {
      op.responses = {};
      for (const [statusCode, respNode] of Object.entries(responsesNode)) {
        const resp: ApiResponse = {
          statusCode,
          description: respNode.description as string | undefined,
        };
        const contentSchema = this.extractJsonSchema(respNode);
        if (contentSchema) {
          const resolved = this.resolveRef(contentSchema, root, allRoots);
          resp.schema = this.parseSchema(resolved, root, allRoots);
        }
        op.responses[statusCode] = resp;
      }
    }

    return op;
  }

  private parseSchema(
    node: Record<string, unknown>,
    root: Record<string, unknown>,
    allRoots: Map<string, Record<string, unknown>>
  ): ApiSchema {
    if (!node) return {};
    const resolved = this.resolveRef(node, root, allRoots);

    const schema: ApiSchema = {
      type: resolved.type as string | undefined,
      format: resolved.format as string | undefined,
      description: resolved.description as string | undefined,
    };

    if (resolved.example !== undefined) {
      schema.example = typeof resolved.example === 'string'
        ? resolved.example
        : JSON.stringify(resolved.example);
    }

    const requiredNode = resolved.required as string[] | undefined;
    if (requiredNode) schema.required = requiredNode;

    const enumNode = resolved.enum as string[] | undefined;
    if (enumNode) schema.enumValues = enumNode;

    const propertiesNode = resolved.properties as Record<string, Record<string, unknown>> | undefined;
    if (propertiesNode) {
      schema.properties = {};
      for (const [key, value] of Object.entries(propertiesNode)) {
        schema.properties[key] = this.parseSchema(value, root, allRoots);
      }
    }

    const itemsNode = resolved.items as Record<string, unknown> | undefined;
    if (itemsNode) {
      schema.items = this.parseSchema(itemsNode, root, allRoots);
    }

    return schema;
  }

  private extractJsonSchema(parentNode: Record<string, unknown>): Record<string, unknown> | null {
    const content = parentNode.content as Record<string, Record<string, unknown>> | undefined;
    if (!content) return null;
    const jsonContent = content['application/json'];
    if (!jsonContent) return null;
    return jsonContent.schema as Record<string, unknown> | null;
  }

  private resolveRef(
    node: Record<string, unknown>,
    root: Record<string, unknown>,
    allRoots: Map<string, Record<string, unknown>>
  ): Record<string, unknown> {
    const ref = node.$ref as string | undefined;
    if (!ref) return node;

    if (ref.startsWith('#/')) {
      const segments = ref.substring(2).split('/');
      let current: unknown = root;
      for (const segment of segments) {
        if (!current || typeof current !== 'object') return node;
        current = (current as Record<string, unknown>)[segment];
      }
      return (current as Record<string, unknown>) ?? node;
    }

    if (ref.includes('#/')) {
      const hashIndex = ref.indexOf('#/');
      const fileName = ref.substring(0, hashIndex);
      const pointer = ref.substring(hashIndex + 2);
      const otherRoot = allRoots.get(fileName);
      if (!otherRoot) return node;
      const segments = pointer.split('/');
      let current: unknown = otherRoot;
      for (const segment of segments) {
        if (!current || typeof current !== 'object') return node;
        current = (current as Record<string, unknown>)[segment];
      }
      return (current as Record<string, unknown>) ?? node;
    }

    return node;
  }
}
