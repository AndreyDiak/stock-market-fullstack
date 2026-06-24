import { Profession } from '@prisma/client';
import { z } from 'zod';

export const characterItemSchema = z.object({
  itemRef: z.string(),
  name: z.string(),
  monthlyPayment: z.number(),
  installmentsTotal: z.number(),
  installmentsPaid: z.number(),
});

export const characterDreamSchema = z.object({
  itemRef: z.string(),
  name: z.string(),
  description: z.string(),
  basePrice: z.number(),
});

export const characterRosterItemSchema = z.object({
  profession: z.nativeEnum(Profession),
  name: z.string(),
  salary: z.number(),
  balance: z.number(),
  savings: z.number(),
  items: z.array(characterItemSchema),
  dreams: z.array(characterDreamSchema),
});

export const characterRosterSchema = z.array(characterRosterItemSchema);

export type CharacterRosterItem = z.infer<typeof characterRosterItemSchema>;
