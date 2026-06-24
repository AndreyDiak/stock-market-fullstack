export {
  createGameBodySchema as createGameSchema,
  updateGameBodySchema as updateGameSchema,
  type CreateGameBody as CreateGameInput,
  type UpdateGameBody as UpdateGameInput,
} from '../../schemas/game.schema.js';

import { z } from 'zod';

export const gameIdParamSchema = z.object({
  id: z.string().uuid(),
});
