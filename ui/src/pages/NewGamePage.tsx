import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CharacterCard from "../components/CharacterCard";
import CharacterSidebar from "../components/character-sidebar/CharacterSidebar";
import GameShell from "../components/game-ui/GameShell";
import PageHeader from "../components/game-ui/PageHeader";
import { PROFESSION_LABELS } from "../constants/professions";
import { PROFESSION_IMAGES } from "../constants/professionImages";
import { getRealEstateImage } from "../constants/realEstateImages";
import {
  useCharactersStore,
  type CharacterItem,
  type CharacterRosterItem,
} from "../stores/characters.store";
import { useGamesStore } from "../stores/games.store";

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

const LOCKED_PLACEHOLDERS = [
  { name: '???', professionLabel: 'Скоро' },
  { name: '???', professionLabel: 'Скоро' },
  { name: '???', professionLabel: 'Скоро' },
] as const;

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
      <GameShell fixedHeight>
        <div className="flex h-full items-center justify-center p-4">
          <p className="rounded-xl border border-emerald-400/20 bg-slate-800/80 px-6 py-4 text-emerald-200/90 shadow-[0_0_24px_rgba(77,196,141,0.15)] backdrop-blur-md">
            Загрузка персонажей...
          </p>
        </div>
      </GameShell>
    );
  }

  if (error || !selected) {
    return (
      <GameShell fixedHeight>
        <div className="flex h-full items-center justify-center p-4">
          <div className="rounded-xl border border-emerald-400/20 bg-slate-800/80 px-6 py-4 text-center backdrop-blur-md">
            <p className="text-emerald-100/90">{error ?? "Персонажи не найдены"}</p>
            <button
              type="button"
              onClick={() => navigate("/slots")}
              className="mt-3 text-sm font-medium text-emerald-400 underline underline-offset-2"
            >
              Назад
            </button>
          </div>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell fixedHeight>
      <div className="flex h-full flex-col overflow-hidden p-3 md:p-4">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[88rem] flex-col">
          <PageHeader
            eyebrow="Night Session"
            title="Выбор персонажа"
            aside={`SLOT ${slot} / 3`}
          />

          <div className="grid min-h-0 flex-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(28rem,38rem)] lg:gap-5">
            <motion.div
              className="grid h-full min-h-0 auto-rows-fr grid-cols-3 grid-rows-3 gap-1.5 sm:gap-2.5"
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
              {LOCKED_PLACEHOLDERS.map((slot, index) => (
                <CharacterCard
                  key={`locked-${index}`}
                  name={slot.name}
                  professionLabel={slot.professionLabel}
                  locked
                />
              ))}
            </motion.div>

            <CharacterSidebar
              character={selected}
              professionLabel={PROFESSION_LABELS[selected.profession]}
              netMonthlyIncome={netMonthlyIncome}
              installmentSlots={installmentSlots}
              getItemImage={getRealEstateImage}
              creating={creating}
              onBack={() => navigate("/slots")}
              onStart={async () => {
                setCreating(true);
                await createGame(slot, selected.name, selected.profession);
                setCreating(false);
                navigate("/slots");
              }}
            />
          </div>
        </div>
      </div>
    </GameShell>
  );
}
