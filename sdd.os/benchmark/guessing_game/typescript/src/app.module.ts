import { Module } from '@nestjs/common';

/**
 * Root application module for the 1A2B Guessing Game.
 *
 * This module serves as the entry point for the NestJS application.
 * Controllers and services should be implemented here by the AI.
 *
 * TODO (for AI implementation):
 * - Add GameController to handle game-related API endpoints
 * - Add PlayerController to handle player-related API endpoints
 * - Add GameService for game business logic
 * - Add PlayerService for player business logic
 * - Configure PrismaService for database access
 */
@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {}
