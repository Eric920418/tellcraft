export class TestResponse {
  readonly status: number;
  readonly body: string;
  readonly headers: ReadonlyMap<string, readonly string[]>;

  constructor(
    status: number,
    body: string,
    headers?: Map<string, string[]>
  ) {
    this.status = status;
    this.body = body;
    this.headers = headers
      ? new Map(Array.from(headers.entries()).map(([k, v]) => [k, [...v]]))
      : new Map();
  }
}
