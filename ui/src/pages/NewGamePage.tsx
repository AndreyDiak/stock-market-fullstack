import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import bg from "../assets/backgrounds/new_game.png";
import imgDeveloper from "../assets/professions/developer.png";
import imgDoctor from "../assets/professions/doctor.png";
import imgEngineer from "../assets/professions/engineer.png";
import imgFarmer from "../assets/professions/farmer.png";
import imgFinancier from "../assets/professions/financier.png";
import imgStreetCleaner from "../assets/professions/streen_cleaner.png";
import CharacterCard from "../components/CharacterCard";
import DreamCard from "../components/DreamCard";
import InstallmentProgress from "../components/InstallmentProgress";
import MoneyAmount from "../components/MoneyAmount";
import PropertyThumb from "../components/PropertyThumb";
import type { CreateGameBody } from "../api/types";
import { PROFESSION_LABELS } from "../constants/professions";
import { getRealEstateImage } from "../constants/realEstateImages";
import {
  useCharactersStore,
  type CharacterItem,
  type CharacterRosterItem,
} from "../stores/characters.store";
import { useGamesStore } from "../stores/games.store";

const PROFESSION_IMAGES: Record<CreateGameBody["profession"], string> = {
  STREET_CLEANER: imgStreetCleaner,
  FARMER: imgFarmer,
  ENGINEER: imgEngineer,
  DEVELOPER: imgDeveloper,
  FINANCIER: imgFinancier,
  DOCTOR: imgDoctor,
};

const characterGridVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.08,
    },
  },
};

const INSTALLMENT_SLOT_COUNT = 2;

function calcActiveInstallmentTotal(items: CharacterItem[]): number {
  return items
    .filter((item) => item.installmentsPaid < item.installmentsTotal)
    .reduce((sum, item) => sum + item.monthlyPayment, 0);
}

function calcNetMonthlyIncome(character: CharacterRosterItem): number {
  return character.salary - calcActiveInstallmentTotal(character.items);
}

function getCharacterImage(character: CharacterRosterItem): string {
  return PROFESSION_IMAGES[character.profession];
}

export default function NewGamePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const slot = Number(searchParams.get("slot")) || 1;
  const { characters, loading, error, loadCharacters } = useCharactersStore();
  const [selected, setSelected] = useState<CharacterRosterItem | null>(null);
  const [creating, setCreating] = useState(false);
  const createGame = useGamesStore((s) => s.createGame);

  useEffect(() => {
    void loadCharacters();
  }, [loadCharacters]);

  useEffect(() => {
    if (characters.length > 0 && !selected) {
      setSelected(characters[0]);
    }
  }, [characters, selected]);

  const installmentSlots = Array.from(
    { length: INSTALLMENT_SLOT_COUNT },
    (_, i) => selected?.items[i] ?? null,
  );

  const netMonthlyIncome = selected ? calcNetMonthlyIncome(selected) : 0;

  if (loading && characters.length === 0) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-cover bg-center p-4"
        style={{ backgroundImage: `url(${bg})` }}
      >
        <p className="rounded-xl bg-white/80 px-6 py-4 text-pastel-700 shadow-sm">
          Загрузка персонажей...
        </p>
      </div>
    );
  }

  if (error || !selected) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-cover bg-center p-4"
        style={{ backgroundImage: `url(${bg})` }}
      >
        <div className="rounded-xl bg-white/90 px-6 py-4 text-center shadow-sm">
          <p className="text-pastel-700">{error ?? "Персонажи не найдены"}</p>
          <button
            type="button"
            onClick={() => navigate("/slots")}
            className="mt-3 text-sm font-medium text-pastel-600 underline"
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col justify-center bg-cover bg-center p-4 md:p-6"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="mx-auto w-full max-w-7xl">
        <h1 className="mb-4 text-2xl font-bold text-pastel-800 md:mb-5">
          Выбор персонажа
        </h1>

        <div className="grid items-stretch gap-4 lg:grid-cols-[1fr_minmax(28rem,42rem)] lg:gap-6">
          <motion.div
            className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 sm:grid-rows-2 sm:gap-4"
            variants={characterGridVariants}
            initial="hidden"
            animate="show"
          >
            {characters.map((char) => (
              <CharacterCard
                key={char.profession}
                name={char.name}
                professionLabel={PROFESSION_LABELS[char.profession]}
                image={getCharacterImage(char)}
                selected={selected.profession === char.profession}
                onClick={() => setSelected(char)}
              />
            ))}
          </motion.div>

          <aside className="flex min-h-0 flex-col">
            <div className="flex h-full flex-col rounded-2xl border-2 border-pastel-200/70 bg-pastel-100/90 p-4 shadow-md backdrop-blur-md md:p-5">
              <div className="mb-4 grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex min-h-0 flex-col">
                  <div className="mb-4 flex shrink-0 gap-3 overflow-hidden rounded-xl border border-pastel-200/60 bg-white/50 p-3">
                    <div className="flex h-36 shrink-0 items-end justify-center rounded-lg bg-pastel-100/80 sm:h-44">
                      <img
                        src={getCharacterImage(selected)}
                        alt={PROFESSION_LABELS[selected.profession]}
                        className="h-full w-full rounded-lg object-contain object-bottom"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-start pt-1">
                      <h2 className="text-xl font-bold leading-tight text-pastel-900 sm:text-2xl">
                        {selected.name}
                      </h2>
                      <p className="mt-1.5 text-sm font-medium text-pastel-700 sm:text-base">
                        {PROFESSION_LABELS[selected.profession]}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 shrink-0 space-y-2 rounded-xl bg-white/40 px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-pastel-700">
                        Зарплата
                      </span>
                      <MoneyAmount
                        amount={selected.salary}
                        suffix="/мес"
                        size="md"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t border-pastel-200/60 pt-2">
                      <span className="text-sm font-medium text-pastel-700">
                        После выплат
                      </span>
                      <MoneyAmount
                        amount={netMonthlyIncome}
                        suffix="/мес"
                        size="md"
                        className={
                          netMonthlyIncome < 0 ? "text-red-600" : undefined
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-pastel-700">
                        Баланс
                      </span>
                      <MoneyAmount amount={selected.balance} size="md" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-pastel-700">
                        Сбережения
                      </span>
                      <MoneyAmount amount={selected.savings} size="md" />
                    </div>
                  </div>

                  <div className="min-h-0 flex-1">
                    <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-pastel-600">
                      Имущество
                    </h3>

                    <div className="mb-3 grid grid-cols-2 gap-2">
                      {installmentSlots.map((item, index) =>
                        item ? (
                          <PropertyThumb
                            key={item.itemRef}
                            name={item.name}
                            image={getRealEstateImage(item.itemRef)}
                          />
                        ) : (
                          <PropertyThumb key={`empty-thumb-${index}`} empty />
                        ),
                      )}
                    </div>

                    <div className="space-y-2">
                      {selected.items.map((item) => (
                        <InstallmentProgress
                          key={item.itemRef}
                          name={item.name}
                          monthlyPayment={item.monthlyPayment}
                          installmentsPaid={item.installmentsPaid}
                          installmentsTotal={item.installmentsTotal}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex min-h-0 flex-col">
                  <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-pastel-600">
                    Мечты
                  </h3>
                  <p className="mb-3 text-xs text-pastel-600">
                    Купите всё, чтобы победить
                  </p>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-1">
                    {selected.dreams.map((dream) => (
                      <DreamCard
                        key={dream.itemRef}
                        name={dream.name}
                        itemRef={dream.itemRef}
                        basePrice={dream.basePrice}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto shrink-0 grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => navigate("/slots")}
                  className="w-full rounded-xl border border-pastel-200 bg-white px-4 py-3 text-sm font-semibold text-pastel-700 shadow-sm transition hover:bg-pastel-50 active:scale-[0.98]"
                >
                  Назад
                </button>
                <button
                  type="button"
                  disabled={creating}
                  onClick={async () => {
                    setCreating(true);
                    await createGame(
                      slot,
                      selected.name,
                      selected.profession,
                    );
                    setCreating(false);
                    navigate("/slots");
                  }}
                  className="w-full rounded-xl bg-pastel-500/90 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-pastel-600 active:scale-[0.98] disabled:opacity-60"
                >
                  {creating ? "Создание..." : "Начать игру"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
