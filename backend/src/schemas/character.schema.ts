import { Profession } from '@prisma/client';
import { z } from 'zod';
import { inventoryItemSchema } from './inventory_item.schema.js';

export const characterSchema = z.object({
  id: z.string().uuid(),
  gameId: z.string().uuid().nullable(),
  name: z.string(),
  balance: z.number(),
  profession: z.nativeEnum(Profession),
  professionLevel: z.number().int(),
  salary: z.number(),
  reputation: z.number(),
  tradingLevel: z.number().int(),
  isNpc: z.boolean(),
  dreamItemRefs: z.array(z.string()),
  totalEarned: z.number(),
  totalSpent: z.number(),
  totalTrades: z.number().int(),
  successfulTrades: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  inventoryItems: z.array(inventoryItemSchema).optional(),
});

export type CharacterDto = z.infer<typeof characterSchema>;
