import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import bg from "../assets/backgrounds/new_game.png";
import { useGamesStore } from "../stores/games.store";

export default function SlotsPage() {
  const navigate = useNavigate();
  const { slots, loading, error, loadSlots } = useGamesStore();

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const slot = (n: number) => slots.find((s) => s.slot === n);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-pastel-700">Выбор сейва</h1>
        <p className="mt-1 text-sm text-pastel-400">
          Выберите слот для загрузки или начните новую игру
        </p>
      </div>

      {loading && <p className="mb-4 text-sm text-pastel-400">Загрузка...</p>}
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="flex w-full max-w-2xl gap-6">
        {[1, 2, 3].map((n) => {
          const data = slot(n);

          return (
            <div
              key={n}
              className="flex flex-1 flex-col rounded-2xl bg-white/90 p-6 shadow-lg backdrop-blur"
            >
              <div className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-pastel-400">
                Слот {n}
              </div>

              {data?.filled ? (
                <>
                  <div className="mb-4 text-center">
                    <div className="text-lg font-bold text-pastel-700">
                      {data.characterName}
                    </div>
                    <div className="text-sm text-pastel-500">
                      {data.profession}
                    </div>
                  </div>
                  <div className="mb-4 space-y-1 text-sm text-pastel-600">
                    <div className="flex justify-between">
                      <span>Баланс</span>
                      <span className="font-semibold">
                        ${data.balance?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ход</span>
                      <span className="font-semibold">{data.day}</span>
                    </div>
                  </div>
                  <button className="mt-auto w-full rounded-xl bg-pastel-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pastel-600 active:scale-[0.98]">
                    Загрузить
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-4 flex flex-1 items-center justify-center text-pastel-300">
                    <svg
                      className="h-12 w-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <button
                    onClick={() => navigate(`/new-game?slot=${n}`)}
                    className="mt-auto w-full rounded-xl border-2 border-dashed border-pastel-300 px-4 py-2 text-sm font-semibold text-pastel-500 transition hover:border-pastel-500 hover:text-pastel-700 active:scale-[0.98]"
                  >
                    Новая игра
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={() => navigate("/menu")}
        className="mt-6 text-sm text-pastel-400 underline underline-offset-2 transition hover:text-pastel-600"
      >
        Назад
      </button>
    </div>
  );
}
