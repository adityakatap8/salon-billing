"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Globe2,
  LayoutDashboard,
  Leaf,
  MapPin,
  Menu,
  Moon,
  Package,
  Settings,
  ShoppingBag,
  Sun,
  X,
  House,
  ClipboardList,
} from "lucide-react";
import { Provider, useStore } from "@/lib/store";
import type { Locale, Role } from "@/lib/model";
import { localeNames } from "@/lib/messages";
import { Button } from "./ui";
import { Storefront } from "./storefront";
import { Admin } from "./admin";
export default function App() {
  return (
    <Provider>
      <Shell />
    </Provider>
  );
}
function Shell() {
  const t = useTranslations();
  const {
    state,
    locale,
    setLocale,
    theme,
    setTheme,
    role,
    setRole,
    salonId,
    setSalonId,
    notice,
  } = useStore();
  const [page, setPage] = useState("home");
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const read = () => {
      const p = location.hash.slice(1);
      if (
        [
          "home",
          "products",
          "salons",
          "orders",
          "settings",
          "cart",
          "story",
          "editor",
        ].includes(p)
      )
        setPage(p);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const go = (p: string) => {
    setPage(p);
    location.hash = p;
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const admin = role !== "customer";
  const nav = [
    { id: "home", icon: House },
    { id: "products", icon: Package },
    { id: "salons", icon: MapPin },
    { id: "orders", icon: ClipboardList },
    { id: "settings", icon: Settings },
  ];
  const adminNav =
    role === "employee"
      ? nav.filter((n) => ["home", "products", "orders"].includes(n.id))
      : role === "manager"
        ? nav.filter((n) => n.id !== "settings")
        : nav;
  return (
    <div
      className={admin ? "app admin-app" : "app"}
      style={
        theme === "light"
          ? ({ "--primary": state.accent } as React.CSSProperties)
          : undefined
      }
    >
      {!admin && (
        <div className="announcement">
          <span>✦</span> {t("salonLoved")}{" "}
          <span className="announcement-dot">·</span> {t("personal")}{" "}
          <span>✦</span>
        </div>
      )}
      {admin && (
        <aside className="sidebar">
          <button className="wordmark" onClick={() => go("home")}>
            {state.business}
            <span>BEAUTY & BEYOND</span>
          </button>
          <div className="sidebar-label">{t("manage")}</div>
          <nav>
            {adminNav.map((n) => (
              <button
                key={n.id}
                className={
                  page === n.id || (page === "editor" && n.id === "home")
                    ? "selected"
                    : ""
                }
                onClick={() => go(n.id)}
              >
                <n.icon size={19} />
                {t(n.id)}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <Leaf />
            <p>{t("footer")}</p>
            <Button
              variant="outline"
              onClick={() => {
                setRole("customer");
                if (salonId === "all") setSalonId("s1");
                go("home");
              }}
            >
              {t("visit")}
              <ArrowUpRight size={16} />
            </Button>
          </div>
        </aside>
      )}
      <div className="app-body">
        <header className={admin ? "admin-header" : "public-header"}>
          {!admin && (
            <>
              <button
                className="mobile-menu icon-button"
                aria-label={t("home")}
                onClick={() => setMenu(!menu)}
              >
                {menu ? <X /> : <Menu />}
              </button>
              <button className="wordmark" onClick={() => go("home")}>
                {state.business}
                <span>BEAUTY & BEYOND</span>
              </button>
              <nav className={`public-nav ${menu ? "expanded" : ""}`}>
                <button
                  className={page === "home" ? "current" : ""}
                  onClick={() => go("home")}
                >
                  {t("home")}
                </button>
                {state.settings.browsing && (
                  <button
                    className={page === "products" ? "current" : ""}
                    onClick={() => go("products")}
                  >
                    {t("collection")}
                  </button>
                )}
                <button
                  className={page === "salons" ? "current" : ""}
                  onClick={() => go("salons")}
                >
                  {t("salons")}
                </button>
                <button onClick={() => go("story")}>{t("story")}</button>
              </nav>
            </>
          )}
          <div className="header-controls">
            <label className="salon-select">
              <MapPin size={15} />
              <select
                aria-label={t("salon")}
                value={salonId}
                onChange={(e) => setSalonId(e.target.value)}
              >
                {admin && role === "owner" && (
                  <option value="all">{t("allSalons")}</option>
                )}
                {state.salons
                  .filter(
                    (s) =>
                      s.active &&
                      (role === "manager" || role === "employee"
                        ? s.id === "s1"
                        : true),
                  )
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.city.split(",")[0]}
                    </option>
                  ))}
              </select>
              <ChevronDown size={12} />
            </label>
            <label className="language-select">
              <Globe2 size={16} />
              <select
                aria-label={t("language")}
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
              >
                {Object.entries(localeNames).map(([k, v]) => (
                  <option value={k} key={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="icon-button"
              aria-label={t(theme === "light" ? "dark" : "light")}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
            </button>
            {!admin && state.settings.shopping && (
              <button
                className="bag-button"
                onClick={() => go("cart")}
                aria-label={t("cart")}
              >
                <ShoppingBag size={19} />
                <span>{state.cart.reduce((n, l) => n + l.quantity, 0)}</span>
              </button>
            )}
            {admin && <div className="avatar">AD</div>}
          </div>
        </header>
        <div className="demo-bar">
          <span>
            <span className="live-dot" />
            {t("demoRoleNotice")}
          </span>
          <label>
            {t("demoRole")}
            <select
              aria-label={t("demoRole")}
              value={role}
              onChange={(e) => {
                const r = e.target.value as Role;
                setRole(r);
                if (
                  r === "manager" ||
                  r === "employee" ||
                  (r === "customer" && salonId === "all")
                )
                  setSalonId("s1");
                go("home");
              }}
            >
              {(["customer", "owner", "manager", "employee"] as Role[]).map(
                (r) => (
                  <option key={r} value={r}>
                    {t(r)}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
        {!admin && <label className="mobile-salon-bar"><MapPin size={14}/><span>{t('salon')}</span><select aria-label={t('salon')} value={salonId === 'all' ? 's1' : salonId} onChange={e => setSalonId(e.target.value)}>{state.salons.filter(s=>s.active).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
        {admin ? (
          <Admin page={page} go={go} />
        ) : (
          <Storefront page={page} go={go} />
        )}
        {!admin && (
          <footer>
            <div className="footer-main">
              <div>
                <div className="wordmark">{state.business}</div>
                <p>{t("footer")}</p>
              </div>
              <div>
                <h4>{t("contact")}</h4>
                <a href="mailto:hello@maisonrose.example">
                  hello@maisonrose.example
                </a>
                <p>+91 22 4000 1234</p>
              </div>
              <div>
                <h4>{t("discover")}</h4>
                <button onClick={() => go("salons")}>
                  {t("salons")} <ArrowUpRight size={14} />
                </button>
                <button
                  onClick={() => {
                    setRole("owner");
                    setSalonId("all");
                    go("home");
                  }}
                >
                  {t("manage")} <LayoutDashboard size={14} />
                </button>
              </div>
            </div>
            <div className="footer-bottom">
              <span>© 2026 {state.business}</span>
              <span>{t("rights")}</span>
              <span>✧</span>
            </div>
          </footer>
        )}
      </div>
      {admin && (
        <nav className="bottom-nav">
          {adminNav.map((n) => (
            <button
              key={n.id}
              className={page === n.id ? "selected" : ""}
              onClick={() => go(n.id)}
            >
              <n.icon size={20} />
              <span>{t(n.id)}</span>
            </button>
          ))}
        </nav>
      )}
      {notice && (
        <div className="toast" role="status">
          <Check size={18} />
          {notice}
        </div>
      )}
    </div>
  );
}
