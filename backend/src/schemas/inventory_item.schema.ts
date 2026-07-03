import { z } from 'zod';

export const inventoryItemSchema = z.object({
  id: z.string().uuid(),
  characterId: z.string().uuid(),
  itemRef: z.string(),
  name: z.string(),
  purchasePrice: z.number(),
  downPaymentAmount: z.number().nullable(),
  isInstallment: z.boolean(),
  monthlyPayment: z.number().nullable(),
  installmentsTotal: z.number().int().nullable(),
  installmentsPaid: z.number().int(),
  special: z.string().nullable(),
  isPaidOff: z.boolean(),
  purchasedAt: z.string().datetime(),
});

export type InventoryItemDto = z.infer<typeof inventoryItemSchema>;
