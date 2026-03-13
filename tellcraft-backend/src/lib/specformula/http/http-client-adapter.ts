import type { TestRequest } from './test-request';
import type { TestResponse } from './test-response';

export interface HttpClientAdapter {
  execute(request: TestRequest): Promise<TestResponse>;
}
