"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { NextIntlClientProvider } from "next-intl";
import { seed, type State, type Locale, type Role } from "./model";
import { messages } from "./messages";
type Context = {
  state: State;
  setState: React.Dispatch<React.SetStateAction<State>>;
  locale: Locale;
  setLocale: (v: Locale) => void;
  theme: string;
  setTheme: (v: string) => void;
  role: Role;
  setRole: (v: Role) => void;
  salonId: string;
  setSalonId: (v: string) => void;
  notice: string;
  notify: (s: string) => void;
  hydrated: boolean;
};
const Store = createContext<Context | null>(null);
export function Provider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(seed);
  const [locale, setLocale] = useState<Locale>("en");
  const [theme, setTheme] = useState("light");
  const [role, setRole] = useState<Role>("customer");
  const [salonId, setSalonId] = useState("s1");
  const [notice, notify] = useState("");
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("maison-rose-v1");
      if (saved) {
        const x = JSON.parse(saved);
        if (x.state?.version === 1) setState(x.state);
        if (["en", "mr", "te", "kn"].includes(x.locale)) setLocale(x.locale);
        if (["dark", "light"].includes(x.theme)) setTheme(x.theme);
        if (["customer", "owner", "manager", "employee"].includes(x.role))
          setRole(x.role);
        if (x.salonId) setSalonId(x.salonId);
      }
    } catch {
      localStorage.removeItem("maison-rose-v1");
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(
          "maison-rose-v1",
          JSON.stringify({ state, locale, theme, role, salonId }),
        );
      } catch {
        notify(messages[locale].storageError);
      }
    }
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = locale;
  }, [state, locale, theme, role, salonId, hydrated]);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => notify(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  return (
    <Store.Provider
      value={{
        state,
        setState,
        locale,
        setLocale,
        theme,
        setTheme,
        role,
        setRole,
        salonId,
        setSalonId,
        notice,
        notify,
        hydrated,
      }}
    >
      <NextIntlClientProvider
        locale={locale}
        messages={messages[locale]}
        timeZone="Asia/Calcutta"
      >
        {children}
      </NextIntlClientProvider>
    </Store.Provider>
  );
}
export function useStore() {
  const x = useContext(Store);
  if (!x) throw new Error("Provider required");
  return x;
}
