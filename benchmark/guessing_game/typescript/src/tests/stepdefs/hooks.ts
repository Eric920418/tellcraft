import 'reflect-metadata';
import { Before, After, BeforeAll, AfterAll, setWorldConstructor } from '@cucumber/cucumber';
import { PrismaClient } from '@prisma/client';
import { ScenarioContext } from './scenario-context';

// Shared instances across all scenarios
let prisma: PrismaClient;
let app: any; // NestJS app instance (INestApplication)

/**
 * Initialize test infrastructure before all scenarios
 */
BeforeAll(async function () {
  // Initialize Prisma Client with temporary SQLite database
  // Note: Prisma doesn't support true in-memory SQLite (:memory:)
  // The temp file will be automatically cleaned up in AfterAll hook
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./test-temp.db'
      }
    }
  });

  // Connect to database
  await prisma.$connect();

  // Drop existing tables if they exist (to ensure schema is up-to-date)
  try {
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS Guess;`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS Player;`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS Game;`);
  } catch (error) {
    // Ignore errors if tables don't exist
  }

  // Create database schema to ensures tables exist before running tests
  await prisma.$executeRawUnsafe(`
    CREATE TABLE Game (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      winnerId TEXT,
      round INTEGER NOT NULL DEFAULT 1,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE Player (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gameId TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      secret TEXT,
      FOREIGN KEY (gameId) REFERENCES Game(id) ON DELETE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX Player_gameId_idx ON Player(gameId);
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE Guess (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gameId TEXT NOT NULL,
      playerId INTEGER NOT NULL,
      round INTEGER NOT NULL,
      guess TEXT NOT NULL,
      resultA INTEGER NOT NULL,
      resultB INTEGER NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (gameId) REFERENCES Game(id) ON DELETE CASCADE,
      FOREIGN KEY (playerId) REFERENCES Player(id) ON DELETE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX Guess_gameId_idx ON Guess(gameId);
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX Guess_playerId_idx ON Guess(playerId);
  `);

  // Initialize NestJS app for testing
  // IMPORTANT: This assumes AppModule exists in src/app.module.ts
  // If AppModule is not yet implemented, the tests will fail with a clear error
  // This is intentional - it guides the AI to implement the required module
  try {
    const { Test } = await import('@nestjs/testing');
    // Module path uses .js extension for ES modules runtime, source file is .ts
    const { AppModule } = await import('../../../src/app.module.js');
    const { PrismaService } = await import('../../../src/prisma.service.js');

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Override PrismaService to use in-memory database for testing
      // This prevents AI-implemented services from creating dev.db file
      // Similar to Python's app.dependency_overrides[database.get_db]
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0); // Listen on random available port

    console.log('NestJS app initialized for testing');
  } catch (error) {
    console.error('Failed to initialize NestJS app:', (error as Error).message);
    console.error('Make sure AppModule exists at src/app.module.ts');
    console.error('Tests will fail until AppModule is implemented');
    // Set app to null - this will cause tests to fail with clear error messages
    app = null;
  }
});

/**
 * Clean up database before each scenario to ensure test isolation
 */
Before(async function () {
  // Clear all tables in reverse order of dependencies to avoid foreign key constraints
  // Note: Adjust table names based on your Prisma schema
  try {
    // Delete in order: child tables first, then parent tables
    await prisma.guess.deleteMany();
    await prisma.player.deleteMany();
    await prisma.game.deleteMany();

    // Reset SQLite auto-increment sequences
    await prisma.$executeRawUnsafe('DELETE FROM sqlite_sequence WHERE name="Player"');
    await prisma.$executeRawUnsafe('DELETE FROM sqlite_sequence WHERE name="Guess"');
  } catch (error) {
    // Ignore errors if tables don't exist yet (during initial setup)
    console.warn('Database cleanup warning:', (error as Error).message);
  }
});

/**
 * Optional: Log test results after each scenario
 */
After(async function ({ pickle, result }) {
  if (result?.status === 'FAILED') {
    console.log(`Scenario failed: ${pickle.name}`);
  }
});

/**
 * Close all connections after all scenarios complete
 */
AfterAll(async function () {
  // Disconnect Prisma
  await prisma.$disconnect();

  // Close NestJS app if it exists
  if (app && typeof app.close === 'function') {
    await app.close();
  }

  // Clean up temporary test database files
  // This ensures no database files persist after tests complete
  // Note: Prisma resolves file paths relative to schema.prisma location (prisma/)
  try {
    const fs = await import('fs/promises');
    await fs.unlink('prisma/test-temp.db').catch(() => {});
    await fs.unlink('prisma/test-temp.db-journal').catch(() => {});
  } catch (error) {
    // Ignore cleanup errors (files may not exist)
  }

  console.log('Test infrastructure cleaned up');
});

/**
 * World Constructor: Inject shared instances into each scenario's context
 * This makes 'app', 'prisma', and 'scenarioContext' available in step definitions via 'this'
 */
setWorldConstructor(function (this: any) {
  // Provide HTTP server for supertest
  this.app = app ? app.getHttpServer() : null;
  this.prisma = prisma;
  this.scenarioContext = new ScenarioContext(prisma);
});
