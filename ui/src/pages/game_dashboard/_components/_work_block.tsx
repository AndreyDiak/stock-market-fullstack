import { MoneyValue } from "../../../components/money/money_value";
import { BriefcaseIcon } from "../../../shared/icons";
import type { right_panel_props } from "../_model/types";
import { SalaryTurnSegments } from "./_salary_turn_segments";

export function WorkBlock({
  careerLevel,
  salary,
  turnsUntilSalary,
  theme,
}: Pick<
  right_panel_props,
  "careerLevel" | "salary" | "turnsUntilSalary" | "theme"
>) {
  return (
    <section className="py-1">
      <div
        className={`rounded-2xl border p-3 ${
          theme.isLight ? "border-slate-200/80" : "border-white/10"
        } bg-transparent`}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BriefcaseIcon className="h-4 w-4 shrink-0 text-emerald-400" />
            <h3
              className={`text-sm font-bold uppercase tracking-wider ${theme.primaryText}`}
            >
              Работа
            </h3>
          </div>
          <span className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-sm font-bold tabular-nums text-emerald-400">
            Lv.{careerLevel}
          </span>
        </div>

        <SalaryTurnSegments turnsUntilSalary={turnsUntilSalary} />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <MoneyValue amount={salary} size="xl" suffix="/мес" />
          <span className={`text-sm ${theme.secondaryText}`}>
            {turnsUntilSalary === 0 ? (
              <span
                className={`font-medium ${theme.isLight ? "text-slate-700" : "text-emerald-300"}`}
              >
                зарплата в этом ходу
              </span>
            ) : (
              <>
                через{" "}
                <span
                  className={`font-medium ${theme.isLight ? "text-slate-700" : "text-slate-300"}`}
                >
                  {turnsUntilSalary}{" "}
                  {turnsUntilSalary === 1
                    ? "ход"
                    : turnsUntilSalary < 5
                      ? "хода"
                      : "ходов"}
                </span>
              </>
            )}
          </span>
        </div>
      </div>
    </section>
  );
}
