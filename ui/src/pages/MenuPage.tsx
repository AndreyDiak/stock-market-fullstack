import { motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import bg from "../assets/backgrounds/menu.png";
import { http } from "../lib/http";
import { useAuthStore } from "../stores/auth.store";
import { useUsersStore } from "../stores/users.store";

const titleVariants = {
  hidden: { y: 40, opacity: 0, scale: 0.92 },
  show: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
};

const menuContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      delayChildren: 0.35,
      staggerChildren: 0.1,
    },
  },
};

const menuItemVariants = {
  hidden: { y: 125, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 320, damping: 26 },
  },
};

export default function MenuPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const { user, loading, loadProfile, clearProfile } = useUsersStore();

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function handleLogout() {
    try {
      await http.post("auth/logout");
    } catch {
      // ignore
    }
    clearProfile();
    logout();
    navigate("/");
  }

  const displayName = user?.displayName;
  const email = user?.email;
  const avatarUrl = user?.avatarUrl;

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="flex w-full max-w-sm flex-col items-center">
        <motion.div
          className="-mt-16 mb-14 text-center"
          variants={titleVariants}
          initial="hidden"
          animate="show"
        >
          <h1 className="text-5xl font-bold tracking-tight text-pastel-700 drop-shadow-sm">
            Trader Simulator
          </h1>
        </motion.div>

        <motion.div
          className="mb-6 w-full rounded-2xl border border-pastel-200/70 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm"
          variants={menuItemVariants}
          initial="hidden"
          animate="show"
        >
          {loading ? (
            <p className="text-center text-sm text-pastel-500">
              Загрузка профиля...
            </p>
          ) : displayName ? (
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pastel-200 text-sm font-semibold text-pastel-700">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-pastel-900">
                  {displayName}
                </p>
                {email && (
                  <p className="truncate text-xs text-pastel-500">{email}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-pastel-500">
              Не удалось загрузить профиль
            </p>
          )}
        </motion.div>

        <motion.div
          className="flex w-full flex-col gap-4"
          variants={menuContainerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.button
            variants={menuItemVariants}
            onClick={() => navigate("/slots")}
            className="w-full rounded-xl bg-pastel-500 px-4 py-3 text-lg font-semibold text-white shadow-md transition hover:bg-pastel-600 active:scale-[0.98]"
          >
            Играть
          </motion.button>

          <motion.button
            variants={menuItemVariants}
            className="w-full rounded-xl border border-pastel-200 bg-white px-4 py-3 text-base font-medium text-pastel-700 shadow-sm transition hover:bg-pastel-50 active:scale-[0.98]"
          >
            Настройки
          </motion.button>

          <motion.button
            variants={menuItemVariants}
            onClick={() => void handleLogout()}
            className="w-full rounded-xl border border-red-100 bg-white px-4 py-3 text-base font-medium text-red-500 shadow-sm transition hover:bg-red-50 active:scale-[0.98]"
          >
            Выйти из аккаунта
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
