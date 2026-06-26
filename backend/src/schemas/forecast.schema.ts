import { z } from 'zod';

export const turnCashflowLineSchema = z.object({
  id: z.string(),
  label: z.string(),
  amount: z.number(),
});

export const nextTurnForecastResponseSchema = z.object({
  lines: z.array(turnCashflowLineSchema),
  incomeTotal: z.number(),
  expenseTotal: z.number(),
  netChange: z.number(),
});

export type NextTurnForecastResponse = z.infer<typeof nextTurnForecastResponseSchema>;
