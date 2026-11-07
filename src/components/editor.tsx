"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  Globe2,
  Monitor,
  RotateCcw,
  Save,
  Smartphone,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { seed, type Homepage, type Locale } from "@/lib/model";
import { localeNames } from "@/lib/messages";
import { Button, Field, Modal } from "./ui";
import { Storefront } from "./storefront";
export function Editor({ go }: { go: (p: string) => void }) {
  const t = useTranslations();
  const { state, setState, locale, notify } = useStore();
  const [draft, setDraft] = useState<Homepage>(() =>
    structuredClone(state.draft),
  );
  const [language, setLanguage] = useState<Locale>(locale);
  const [preview, setPreview] = useState(false);
  const [device, setDevice] = useState("desktop");
  const setText = (field: "title" | "subtitle" | "heading", value: string) =>
    setDraft((d) => ({ ...d, [field]: { ...d[field], [language]: value } }));
  const move = (index: number, delta: number) => {
    const featured = [...draft.featured];
    [featured[index], featured[index + delta]] = [
      featured[index + delta],
      featured[index],
    ];
    setDraft((d) => ({ ...d, featured }));
  };
  return (
    <>
      <div className="admin-page-title">
        <div>
          <div className="eyebrow">{t("editWebsite")}</div>
          <h1>{t("editor")}</h1>
        </div>
        <div className="row-actions">
          <Button variant="outline" onClick={() => setPreview(true)}>
            <Eye size={16} />
            {t("preview")}
          </Button>
          <Button
            onClick={() => {
              if (!draft.title.en.trim()) return notify(t("required"));
              setState((s) => ({
                ...s,
                previous: structuredClone(s.published),
                published: structuredClone(draft),
                draft: structuredClone(draft),
              }));
              notify(t("published"));
            }}
          >
            <Globe2 size={16} />
            {t("publish")}
          </Button>
        </div>
      </div>
      <div className="editor-layout">
        <section className="panel form">
          <Field label={t("language")}>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Locale)}
            >
              {Object.entries(localeNames).map(([l, n]) => (
                <option key={l} value={l}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          {language !== "en" &&
            (["title", "subtitle", "heading"] as const).some(
              (f) => !draft[f][language],
            ) && <p className="info-box">{t("translationMissing")}</p>}
          <Field label={t("heroTitle")}>
            <textarea
              rows={3}
              value={draft.title[language]}
              placeholder={draft.title.en}
              onChange={(e) => setText("title", e.target.value)}
            />
          </Field>
          <Field label={t("heroSubtitle")}>
            <textarea
              rows={4}
              value={draft.subtitle[language]}
              placeholder={draft.subtitle.en}
              onChange={(e) => setText("subtitle", e.target.value)}
            />
          </Field>
          <Field label={t("image")}>
            <input
              value={draft.image}
              onChange={(e) =>
                setDraft((d) => ({ ...d, image: e.target.value }))
              }
            />
          </Field>
          <Field label={t("sectionHeading")}>
            <input
              value={draft.heading[language]}
              placeholder={draft.heading.en}
              onChange={(e) => setText("heading", e.target.value)}
            />
          </Field>
          <h3>{t("sections")}</h3>
          {(["featured", "categories", "locations"] as const).map(
            (section, i) => (
              <label className="checkbox" key={section}>
                <input
                  type="checkbox"
                  checked={draft.sections[section]}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      sections: { ...d.sections, [section]: e.target.checked },
                    }))
                  }
                />
                {t(["featured", "category", "salons"][i])}
              </label>
            ),
          )}
        </section>
        <section className="panel">
          <h2>{t("featured")}</h2>
          <div className="featured-sort">
            {draft.featured.map((id, i) => {
              const p = state.products.find((p) => p.id === id);
              if (!p) return null;
              return (
                <div key={id}>
                  <img src={p.image} alt="" />
                  <span>{p.name[locale] || p.name.en}</span>
                  <button
                    className="icon-button"
                    disabled={i === 0}
                    aria-label={t("moveUp")}
                    onClick={() => move(i, -1)}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    className="icon-button"
                    disabled={i === draft.featured.length - 1}
                    aria-label={t("moveDown")}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDown size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={t("remove")}
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        featured: d.featured.filter((x) => x !== id),
                      }))
                    }
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
          <div className="product-picker">
            {state.products
              .filter((p) => !p.archived && p.visible)
              .map((p) => (
                <label key={p.id} className="checkbox">
                  <input
                    type="checkbox"
                    checked={draft.featured.includes(p.id)}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        featured: e.target.checked
                          ? [...d.featured, p.id]
                          : d.featured.filter((id) => id !== p.id),
                      }))
                    }
                  />
                  {p.name[locale] || p.name.en}
                  <small>{p.variant}</small>
                </label>
              ))}
          </div>
        </section>
      </div>
      <div className="editor-actions">
        <Button
          variant="outline"
          onClick={() => {
            setDraft(structuredClone(state.published));
            go("home");
          }}
        >
          {t("cancel")}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setState((s) => ({ ...s, draft: structuredClone(draft) }));
            notify(t("saved"));
          }}
        >
          <Save size={16} />
          {t("saveDraft")}
        </Button>
        <Button
          variant="outline"
          disabled={!state.previous}
          onClick={() => {
            if (state.previous) {
              const previous = structuredClone(state.previous);
              setState((s) => ({
                ...s,
                published: previous,
                previous: s.published,
                draft: previous,
              }));
              setDraft(previous);
              notify(t("published"));
            }
          }}
        >
          <RotateCcw size={16} />
          {t("restore")}
        </Button>
      </div>
      {preview && (
        <Modal title={t("preview")} onClose={() => setPreview(false)} wide>
          <div className="tabs">
            {["desktop", "mobile"].map((d) => (
              <button
                className={device === d ? "active" : ""}
                key={d}
                onClick={() => setDevice(d)}
              >
                {d === "desktop" ? (
                  <Monitor size={16} />
                ) : (
                  <Smartphone size={16} />
                )}{" "}
                {t(d)}
              </button>
            ))}
          </div>
          <div className={`website-preview ${device}`}>
            <Storefront page="home" go={() => {}} preview={draft} />
          </div>
        </Modal>
      )}
    </>
  );
}
export function SettingsPage() {
  const t = useTranslations();
  const { state, setState, locale, setLocale, theme, setTheme, notify } =
    useStore();
  const [name, setName] = useState(state.business);
  const [accent, setAccent] = useState(state.accent);
  const [reset, setReset] = useState(false);
  return (
    <>
      <div className="admin-page-title">
        <div>
          <div className="eyebrow">{t("manage")}</div>
          <h1>{t("settings")}</h1>
        </div>
      </div>
      <div className="settings-grid">
        <section className="panel form">
          <h2>{t("profile")}</h2>
          <Field label={t("name")}>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label={t("branding")}>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
            />
          </Field>
          <Button
            onClick={() => {
              if (!name.trim()) return notify(t("required"));
              setState((s) => ({ ...s, business: name, accent }));
              notify(t("saved"));
            }}
          >
            <Check size={16} />
            {t("save")}
          </Button>
        </section>
        <section className="panel form">
          <h2>
            {t("language")} & {t("theme")}
          </h2>
          <Field label={t("language")}>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
            >
              {Object.entries(localeNames).map(([l, n]) => (
                <option value={l} key={l}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("theme")}>
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="light">{t("light")}</option>
              <option value="dark">{t("dark")}</option>
            </select>
          </Field>
        </section>
        <section className="panel">
          <h2>{t("features")}</h2>
          {(["browsing", "shopping", "reservations"] as const).map((f) => (
            <label className="toggle-row" key={f}>
              <div>
                <strong>{t(f)}</strong>
              </div>
              <input
                type="checkbox"
                role="switch"
                checked={state.settings[f]}
                onChange={(e) => {
                  setState((s) => ({
                    ...s,
                    settings: { ...s.settings, [f]: e.target.checked },
                  }));
                  notify(t("saved"));
                }}
              />
            </label>
          ))}
        </section>
        <section className="panel">
          <h2>{t("permissions")}</h2>
          <label className="toggle-row">
            <strong>{t("employeeStock")}</strong>
            <input
              type="checkbox"
              role="switch"
              checked={state.settings.employeeStock}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  settings: { ...s.settings, employeeStock: e.target.checked },
                }))
              }
            />
          </label>
          <div className="reset-box">
            <h3>{t("reset")}</h3>
            <Button variant="outline" onClick={() => setReset(true)}>
              <RotateCcw size={16} />
              {t("reset")}
            </Button>
          </div>
        </section>
      </div>
      {reset && (
        <Modal title={t("reset")} onClose={() => setReset(false)}>
          <p>{t("resetConfirm")}</p>
          <div className="form-actions">
            <Button variant="outline" onClick={() => setReset(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={() => {
                const data = seed();
                setState(data);
                setName(data.business);
                setAccent(data.accent);
                setReset(false);
                notify(t("saved"));
              }}
            >
              {t("reset")}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
