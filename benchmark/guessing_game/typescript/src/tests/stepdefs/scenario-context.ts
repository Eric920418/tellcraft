import { Response } from 'supertest';
import { PrismaClient } from '@prisma/client';

export class ScenarioContext {
  lastResponse: Response | null = null;
  prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  setLastResponse(response: Response): void {
    this.lastResponse = response;
  }

  getLastResponse(): Response | null {
    return this.lastResponse;
  }

  reset(): void {
    this.lastResponse = null;
  }
}
