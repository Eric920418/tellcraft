export class TestRequest {
  readonly method: string;
  readonly url: string;
  readonly headers: ReadonlyMap<string, readonly string[]>;
  readonly queryParams: ReadonlyMap<string, string>;
  readonly body: string | null;

  private constructor(builder: TestRequestBuilder) {
    this.method = builder.method;
    this.url = builder.url;
    this.headers = new Map(
      Array.from(builder._headers.entries()).map(([k, v]) => [k, [...v]])
    );
    this.queryParams = new Map(builder._queryParams);
    this.body = builder._body;
  }

  static builder(method: string, url: string): TestRequestBuilder {
    return new TestRequestBuilder(method, url);
  }

  /** Build from builder (called internally) */
  static _build(builder: TestRequestBuilder): TestRequest {
    return new TestRequest(builder);
  }
}

export class TestRequestBuilder {
  readonly method: string;
  readonly url: string;
  readonly _headers: Map<string, string[]> = new Map();
  readonly _queryParams: Map<string, string> = new Map();
  _body: string | null = null;

  constructor(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  header(name: string, value: string): this {
    const existing = this._headers.get(name);
    if (existing) {
      existing.push(value);
    } else {
      this._headers.set(name, [value]);
    }
    return this;
  }

  queryParam(name: string, value: string): this {
    this._queryParams.set(name, value);
    return this;
  }

  body(body: string): this {
    this._body = body;
    return this;
  }

  build(): TestRequest {
    return TestRequest._build(this);
  }
}
