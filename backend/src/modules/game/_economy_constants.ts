/** Зарплата выплачивается на 5-м ходу и далее каждые 5 ходов (5, 10, 15, …). */
export const SALARY_CYCLE_TURNS = 5;

export function isSalaryTurn(step: number): boolean {
  return step > 0 && step % SALARY_CYCLE_TURNS === 0;
}

export function turnsUntilSalary(step: number): number {
  const remainder = step % SALARY_CYCLE_TURNS;
  if (remainder === 0) return 0;
  return SALARY_CYCLE_TURNS - remainder;
}
