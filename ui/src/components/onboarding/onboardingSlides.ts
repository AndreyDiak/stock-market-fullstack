export type ToneType =
  | "positive"
  | "warning"
  | "danger"
  | "info"
  | "money"
  | "skill"
  | "safe";

export type SlideLayout =
  | "flow"
  | "forecast"
  | "section-grid"
  | "dream-card"
  | "advice-cards"
  | "guide-final";

interface FlowSlide {
  key: "welcome";
  icon: string;
  title: string;
  subtitle: string;
  layout: "flow";
  flow: { label: string; value: string; icon: string }[];
  bullets: string[];
  note: { type: "tip"; text: string };
}

interface ForecastSlide {
  key: "turn-economy";
  icon: string;
  title: string;
  subtitle: string;
  layout: "forecast";
  forecast: {
    title: string;
    rows: {
      label: string;
      value: string;
      tone: ToneType;
      description: string;
    }[];
  };
  spendingScale: {
    title: string;
    items: { label: string; text: string; tone: ToneType }[];
  };
  warning: string;
}

interface SectionGridSlide {
  key: "sections";
  icon: string;
  title: string;
  subtitle: string;
  layout: "section-grid";
  sections: {
    title: string;
    icon: string;
    gives: string;
    purpose: string;
    reward: string;
  }[];
  note: { type: "tip"; text: string };
}

interface DreamCardSlide {
  key: "dream";
  icon: string;
  title: string;
  subtitle: string;
  layout: "dream-card";
  dreamPreview: {
    title: string;
    progressLabel: string;
    requirements: {
      label: string;
      current: string;
      target: string;
      tone: ToneType;
    }[];
    fakeActionLabel: string;
  };
  bullets: string[];
  note: { type: "tip"; text: string };
}

interface AdviceCardsSlide {
  key: "growth-strategy";
  icon: string;
  title: string;
  subtitle: string;
  layout: "advice-cards";
  cards: {
    title: string;
    icon: string;
    text: string;
    badge: string;
    tone: ToneType;
  }[];
  path?: { label: string; icon: string }[];
  warning: string;
}

interface GuideFinalSlide {
  key: "guide";
  icon: string;
  title: string;
  subtitle: string;
  layout: "guide-final";
  guideCards: { title: string; text: string; icon: string }[];
  bullets: string[];
  actions: {
    secondary: string;
    primary: string;
  };
}

export type OnboardingSlide =
  | FlowSlide
  | ForecastSlide
  | SectionGridSlide
  | DreamCardSlide
  | AdviceCardsSlide
  | GuideFinalSlide;

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    key: "welcome",
    icon: "gamepad",
    title: "Добро пожаловать в игру",
    subtitle:
      "Вы управляете персонажем, развиваете карьеру, наращиваете капитал и идёте к его мечте.",
    layout: "flow",
    flow: [
      { label: "Работа", value: "стабильный доход", icon: "briefcase" },
      { label: "Активы", value: "акции и имущество", icon: "layers" },
      { label: "Капитал", value: "рост и прибыль", icon: "trending-up" },
      { label: "Мечта", value: "дорога к победе", icon: "star" },
    ],
    bullets: [
      "У каждого персонажа своя стартовая ситуация",
      "У каждого персонажа своя мечта",
      "Мечта состоит из этапов",
      "Выполнили все этапы — победили",
    ],
    note: {
      type: "tip",
      text: "Сначала смотрите не на все возможности сразу, а на текущий этап мечты.",
    },
  },

  {
    key: "turn-economy",
    icon: "calendar",
    title: "Каждый ход меняет экономику",
    subtitle:
      "Когда вы завершаете ход, игра начисляет доходы, списывает траты, обновляет рынок и создаёт новые события.",
    layout: "forecast",
    forecast: {
      title: "Пример прогноза хода",
      rows: [
        {
          label: "Зарплата",
          value: "+900",
          tone: "positive",
          description: "приходит регулярно",
        },
        {
          label: "Склад",
          value: "+400",
          tone: "positive",
          description: "от активов",
        },
        {
          label: "Расходы на жизнь",
          value: "-320",
          tone: "warning",
          description: "могут меняться",
        },
        {
          label: "Платежи по рассрочке",
          value: "-614",
          tone: "danger",
          description: "обязательные списания",
        },
        {
          label: "Итог хода",
          value: "+366",
          tone: "positive",
          description: "важно проверять перед ходом",
        },
      ],
    },
    spendingScale: {
      title: "Шкала трат",
      items: [
        {
          label: "Зелёное",
          text: "доходы и положительный итог",
          tone: "positive",
        },
        {
          label: "Жёлтое",
          text: "обязательные траты и нагрузка",
          tone: "warning",
        },
        {
          label: "Красное",
          text: "риск минуса и банкротства",
          tone: "danger",
        },
      ],
    },
    warning:
      "Перед завершением хода проверяйте итог. Если баланс после списаний уйдёт в минус — вы проиграли.",
  },

  {
    key: "sections",
    icon: "grid",
    title: "Главные разделы игры",
    subtitle:
      "Каждый раздел помогает по-своему: заработать, снизить риски, найти активы или приблизиться к мечте.",
    layout: "section-grid",
    sections: [
      {
        title: "Мечта",
        icon: "star",
        gives: "маршрут к победе",
        purpose: "показывает текущий этап и требования",
        reward: "открывает следующий этап",
      },
      {
        title: "Работа",
        icon: "briefcase",
        gives: "стабильный доход",
        purpose: "даёт деньги для первых решений",
        reward: "зарплата растёт через квалификацию",
      },
      {
        title: "Навыки",
        icon: "graduation-cap",
        gives: "новые возможности",
        purpose: "улучшают банк, трейдинг, доход и слоты",
        reward: "меньше издержек и больше доступных действий",
      },
      {
        title: "Биржа",
        icon: "activity",
        gives: "рост капитала",
        purpose: "покупка акций, дивиденды, риск",
        reward: "портфель для мечты и прибыли",
      },
      {
        title: "Недвижимость и банк",
        icon: "home",
        gives: "активы и пассивный доход",
        purpose: "покупка объектов, рассрочка, платежи",
        reward: "имущество, доход, прогресс мечты",
      },
      {
        title: "Сделки",
        icon: "handshake",
        gives: "редкие предложения",
        purpose: "обмен активов с NPC",
        reward: "выгода, ликвидность или предмет мечты",
      },
      {
        title: "Новости",
        icon: "newspaper",
        gives: "рыночные сигналы",
        purpose: "показывают события и подсказки",
        reward: "лучшие решения на бирже и в сделках",
      },
    ],
    note: {
      type: "tip",
      text: "Не нужно использовать всё сразу. Смотрите на мечту и выбирайте раздел, который помогает закрыть ближайшее требование.",
    },
  },

  {
    key: "dream",
    icon: "star",
    title: "Мечта — ваш маршрут к победе",
    subtitle:
      "Мечта показывает, что нужно сделать именно этому персонажу. Это главный ориентир всей партии.",
    layout: "dream-card",
    dreamPreview: {
      title: "Текущий этап мечты",
      progressLabel: "Этап 1 из 3",
      requirements: [
        {
          label: "Накопить баланс",
          current: "6 000",
          target: "10 000",
          tone: "money",
        },
        {
          label: "Повысить квалификацию",
          current: "1",
          target: "2",
          tone: "skill",
        },
      ],
      fakeActionLabel: "Проверить требования",
    },
    bullets: [
      "Активен только текущий этап",
      "Когда требования выполнены — этап нужно завершить вручную",
      "Выполненные этапы не откатываются назад",
      "Последний этап завершает игру победой",
    ],
    note: {
      type: "tip",
      text: "Мечта может требовать деньги, активы, акции, навыки, репутацию или пассивный доход.",
    },
  },

  {
    key: "growth-strategy",
    icon: "trending-up",
    title: "Как расти и не ошибаться",
    subtitle:
      "Главный навык игрока — не просто зарабатывать, а держать баланс между ростом и безопасностью.",
    layout: "advice-cards",
    cards: [
      {
        title: "Оставляйте запас",
        icon: "shield",
        text: "Не тратьте весь баланс под ноль. Следующий ход может принести расходы или платёж.",
        badge: "Безопасность",
        tone: "warning",
      },
      {
        title: "Проверяйте прогноз хода",
        icon: "calendar",
        text: "Перед завершением хода смотрите итог — зелёный+, жёлтый риск, красный опасно.",
        badge: "Контроль",
        tone: "warning",
      },
      {
        title: "Сначала стабилизируйте доход",
        icon: "briefcase",
        text: "Работа и первые активы помогают переживать расходы и копить на мечту.",
        badge: "Старт",
        tone: "positive",
      },
      {
        title: "Качайте навыки под задачу",
        icon: "graduation-cap",
        text: "Банк, трейдинг и слоты открывают доступ к более сильным решениям.",
        badge: "Прогресс",
        tone: "info",
      },
      {
        title: "Не берите актив без запаса",
        icon: "handshake",
        text: "Перед покупкой проверьте, сможете ли покрывать платежи в ближайшие ходы.",
        badge: "Риск",
        tone: "danger",
      },
    ],
    path: [
      { label: "Работа", icon: "briefcase" },
      { label: "Накопления", icon: "shield" },
      { label: "Актив / Навык", icon: "trending-up" },
      { label: "Рост дохода", icon: "star" },
      { label: "К мечте", icon: "star" },
    ],
    warning:
      "Самая частая ошибка новичка — купить дорогой актив и забыть про платежи следующего хода.",
  },

  {
    key: "guide",
    icon: "book-open",
    title: "Руководство всегда рядом",
    subtitle:
      "Если что-то непонятно, откройте раздел «Руководство» в левой навигации. Там собраны объяснения всех механик.",
    layout: "guide-final",
    guideCards: [
      {
        title: "Быстрый старт",
        text: "план первых действий",
        icon: "zap",
      },
      {
        title: "Мечта",
        text: "этапы и требования",
        icon: "star",
      },
      {
        title: "Экономика",
        text: "доходы, расходы, прогноз",
        icon: "wallet",
      },
      {
        title: "Биржа",
        text: "акции, дивиденды, риск",
        icon: "activity",
      },
      {
        title: "Банк и недвижимость",
        text: "рассрочка, ипотека, доход",
        icon: "home",
      },
      {
        title: "Сделки и новости",
        text: "обмены, сигналы, события",
        icon: "newspaper",
      },
    ],
    bullets: [
      "Руководство можно открыть в любой момент",
      "Знакомство можно пройти заново",
      "Подсказки помогут разобраться без чтения длинной документации",
    ],
    actions: {
      secondary: "Открыть руководство",
      primary: "Начать игру",
    },
  },
];
