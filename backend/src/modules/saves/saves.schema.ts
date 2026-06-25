export {
  createGameBodySchema as createSaveSchema,
  updateGameBodySchema as updateSaveSchema,
  type CreateGameBody as CreateSaveInput,
  type UpdateGameBody as UpdateSaveInput,
} from '../../schemas/game.schema.js';

import { z } from 'zod';

export const saveIdParamSchema = z.object({
  id: z.string().uuid(),
});
