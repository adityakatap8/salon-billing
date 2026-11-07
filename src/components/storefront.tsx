"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Flower2,
  Leaf,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  available,
  placeOrder,
  type Product,
  type Homepage,
} from "@/lib/model";
import { categories } from "@/lib/messages";
import { Button, Empty, Field, Modal, Stepper } from "./ui";
import { CustomerForm } from "./forms";
export const money = (n: number, locale = "en") =>
  new Intl.NumberFormat(locale === "en" ? "en-IN" : `${locale}-IN`, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
export function Storefront({
  page,
  go,
  preview,
}: {
  page: string;
  go: (p: string) => void;
  preview?: Homepage;
}) {
  const t = useTranslations();
  const { state, locale, theme, salonId, setSalonId, setState, notify } =
    useStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(-1);
  const [sort, setSort] = useState("recommended");
  const [selected, setSelected] = useState<Product | null>(null);
  const [reserve, setReserve] = useState<Product | null>(null);
  const [checkout, setCheckout] = useState(false);
  const sid = salonId === "all" ? "s1" : salonId;
  const home = preview ?? state.published;
  const products = state.products.filter((p) => p.visible && !p.archived);
  const heroProduct = products.find(p => p.id === home.featured[0]) ?? products[0];
  const add = (p: Product, q = 1) => {
    const existing =
      state.cart.find((l) => l.productId === p.id)?.quantity ?? 0;
    if (existing + q > available(state, p.id, sid))
      return notify(t("stockError"));
    setState((s) => ({
      ...s,
      cart: s.cart.some((l) => l.productId === p.id)
        ? s.cart.map((l) =>
            l.productId === p.id ? { ...l, quantity: l.quantity + q } : l,
          )
        : [...s.cart, { productId: p.id, quantity: q }],
    }));
    notify(t("added"));
  };
  const filtered = products
    .filter(
      (p) =>
        (category === -1 || p.category === category) &&
        (p.name[locale] || p.name.en)
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "priceLow"
        ? a.price - b.price
        : sort === "priceHigh"
          ? b.price - a.price
          : 0,
    );
  const card = (p: Product, i: number) => (
    <ProductCard
      key={p.id}
      product={p}
      index={i}
      onView={() => setSelected(p)}
      onAdd={() => add(p)}
    />
  );
  const total = state.cart.reduce(
    (n, l) =>
      n +
      (state.products.find((p) => p.id === l.productId)?.price ?? 0) *
        l.quantity,
    0,
  );
  return (
    <>
      {page === "home" && (
        <main>
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow">
                <span /> {t("beauty")}
              </div>
              <h1>{home.title[locale] || home.title.en}</h1>
              <p>{home.subtitle[locale] || home.subtitle.en}</p>
              <div className="hero-actions">
                {state.settings.browsing && (
                  <Button onClick={() => go("products")}>
                    {t("discover")}
                    <ArrowRight size={18} />
                  </Button>
                )}
                <button className="text-link" onClick={() => go("salons")}>
                  {t("findSalon")}
                  <ArrowUpRight size={16} />
                </button>
              </div>
              <div className="hero-proof">
                <div className="proof-faces">
                  <img
                    src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=faces"
                    alt=""
                  />
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces"
                    alt=""
                  />
                  <img
                    src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&crop=faces"
                    alt=""
                  />
                </div>
                <div>
                  <div className="stars">★★★★★</div>
                  <span>
                    {t("salonLoved")} · 10 {t("salons")}
                  </span>
                </div>
              </div>
            </div>
            <div className="hero-art">
              {theme === "dark" ? (
                <img
                  className="hero-photo dark-photo"
                  src="/reference-noir.jpg"
                  alt=""
                />
              ) : home.image && home.image !== "/hero-light.svg" ? (
                <img className="hero-photo" src={home.image} alt="" />
              ) : (
                <>
                  <img className="hero-photo" src="/beauty-hero.png" alt="" />
                  <div className="hero-glow" />
                </>
              )}
              <div className="vertical-note">
                MAISON ROSÉ · THE DAILY RITUAL
              </div>
              <span className="art-sparkle">✧</span>
              <div
                className="hero-product"
                onClick={() => heroProduct && setSelected(heroProduct)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === "Enter" && heroProduct && setSelected(heroProduct)
                }
              >
                <img src={heroProduct?.image} alt="" />
                <div>
                  <small>{t("salonLoved")}</small>
                  <h3>{heroProduct?.name[locale] || heroProduct?.name.en}</h3>
                  <span>{money(heroProduct?.price ?? 0, locale)}</span>
                </div>
                <ArrowUpRight size={20} />
              </div>
            </div>
            <div className="hero-caption">
              01 <span /> 03
            </div>
          </section>
          <div className="benefits">
            <span>
              <Flower2 />
              {t("salonLoved")}
            </span>
            <i />
            <span>
              <Leaf />
              {t("considered")}
            </span>
            <i />
            <span>
              <ShieldCheck />
              {t("personal")}
            </span>
            <i />
            <span>
              <Truck />
              {t("pickup")}
            </span>
          </div>
          {home.sections.featured && state.settings.browsing && (
            <section className="section featured-section">
              <div className="section-title">
                <div>
                  <div className="eyebrow">{t("curated")}</div>
                  <h2>{home.heading[locale] || home.heading.en}</h2>
                </div>
                <button className="text-link" onClick={() => go("products")}>
                  {t("viewAll")}
                  <ArrowRight size={17} />
                </button>
              </div>
              <div className="product-grid">
                {home.featured
                  .map((id) => products.find((p) => p.id === id))
                  .filter((p): p is Product => !!p)
                  .map(card)}
              </div>
            </section>
          )}
          {home.sections.categories && state.settings.browsing && (
            <section className="section category-section">
              <div className="section-title">
                <div>
                  <div className="eyebrow">{t("discover")}</div>
                  <h2>{t("collection")}</h2>
                </div>
                <Sparkles className="gold" size={30} />
              </div>
              <div className="category-grid">
                {categories.map((c, i) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCategory(i);
                      go("products");
                    }}
                  >
                    <img src={state.products[i]?.image} alt="" />
                    <div>
                      <h3>{t(c)}</h3>
                      <ArrowUpRight size={20} />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
          {home.sections.locations && (
            <section className="salon-promo">
              <div className="salon-promo-image">
                <img
                  src="https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=1200&q=85"
                  alt=""
                />
              </div>
              <div>
                <div className="eyebrow">MAISON ROSÉ</div>
                <h2>{t("ritual")}</h2>
                <p>{t("ritualText")}</p>
                <Button variant="outline" onClick={() => go("salons")}>
                  {t("findSalon")}
                  <ArrowUpRight size={18} />
                </Button>
                <div className="promo-numbers">
                  <span>
                    10 <small>{t("salons")}</small>
                  </span>
                  <span>
                    60 <small>{t("employees")}</small>
                  </span>
                </div>
              </div>
            </section>
          )}
        </main>
      )}
      {page === "products" && (
        <main className="section catalogue-page">
          <div className="page-intro">
            <div className="eyebrow">{t("curated")}</div>
            <h1>{t("collection")}</h1>
            <p>{t("footer")}</p>
          </div>
          {!state.settings.browsing ? (
            <Empty text={t("unavailable")} />
          ) : (
            <>
              <div className="catalogue-toolbar">
                <div className="search-box">
                  <Search size={18} />
                  <input
                    aria-label={t("search")}
                    placeholder={t("search")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <label className="sort-select">
                  <SlidersHorizontal size={16} />
                  <select
                    aria-label={t("sort")}
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    {["recommended", "priceLow", "priceHigh"].map((s) => (
                      <option key={s} value={s}>
                        {t(s)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="filter-chips">
                {[-1, ...categories.map((_, i) => i)].map((i) => (
                  <button
                    className={category === i ? "active" : ""}
                    key={i}
                    onClick={() => setCategory(i)}
                  >
                    {t(i === -1 ? "all" : categories[i])}
                  </button>
                ))}
              </div>
              <div className="product-grid">{filtered.map(card)}</div>
              {!filtered.length && <Empty text={t("noResults")} />}
            </>
          )}
        </main>
      )}
      {page === "salons" && (
        <main className="section">
          <div className="page-intro">
            <div className="eyebrow">{t("personal")}</div>
            <h1>{t("salons")}</h1>
            <p>{t("ritualText")}</p>
          </div>
          <div className="salon-grid">
            {state.salons
              .filter((s) => s.active)
              .map((s, i) => (
                <article className="salon-card" key={s.id}>
                  <div className="salon-card-image">
                    <img
                      src={`https://images.unsplash.com/${i % 2 ? "photo-1600948836101-f9ffda59d250" : "photo-1560066984-138dadb4c035"}?auto=format&fit=crop&w=800&q=80`}
                      alt=""
                    />
                    <span>0{i + 1}</span>
                  </div>
                  <div>
                    <h3>{s.name}</h3>
                    <p>
                      <MapPin size={14} />
                      {s.address}
                    </p>
                    <p>
                      {t("manager")}: {s.manager}
                    </p>
                    <a href={`tel:${s.phone}`} className="text-link">
                      {s.phone}
                      <ArrowUpRight size={15} />
                    </a>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSalonId(s.id);
                        go("products");
                      }}
                    >
                      {t("collection")}
                      <ArrowRight size={16} />
                    </Button>
                  </div>
                </article>
              ))}
          </div>
        </main>
      )}
      {page === "story" && (
        <main className="section story-section">
          <div className="eyebrow">MAISON ROSÉ</div>
          <h1>{t("ritual")}</h1>
          <p>{t("aboutText")}</p>
          <img
            src="https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=1600&q=85"
            alt=""
          />
          <Button onClick={() => go("salons")}>
            {t("findSalon")}
            <ArrowRight size={18} />
          </Button>
        </main>
      )}
      {page === "cart" && (
        <main className="section cart-page">
          <div className="page-intro">
            <div className="eyebrow">MAISON ROSÉ</div>
            <h1>{t("cart")}</h1>
          </div>
          {!state.settings.shopping || !state.cart.length ? (
            <>
              <Empty text={t("empty")} />
              <Button onClick={() => go("products")}>
                {t("continueShopping")}
              </Button>
            </>
          ) : (
            <div className="cart-layout">
              <div>
                {state.cart.map((l) => {
                  const p = state.products.find((p) => p.id === l.productId);
                  if (!p) return null;
                  return (
                    <div className="cart-item" key={p.id}>
                      <img src={p.image} alt="" />
                      <div>
                        <small>{p.brand}</small>
                        <h3>{p.name[locale] || p.name.en}</h3>
                        <p>{p.variant}</p>
                        <button
                          className="text-link"
                          onClick={() =>
                            setState((s) => ({
                              ...s,
                              cart: s.cart.filter((x) => x.productId !== p.id),
                            }))
                          }
                        >
                          {t("remove")}
                        </button>
                      </div>
                      <div>
                        <strong>{money(p.price * l.quantity, locale)}</strong>
                        <Stepper
                          value={l.quantity}
                          min={1}
                          max={available(state, p.id, sid)}
                          onChange={(n) =>
                            setState((s) => ({
                              ...s,
                              cart: s.cart.map((x) =>
                                x.productId === p.id
                                  ? { ...x, quantity: n }
                                  : x,
                              ),
                            }))
                          }
                        />
                        {l.quantity > available(state, p.id, sid) && (
                          <small className="error">{t("stockError")}</small>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <aside className="summary panel">
                <h3>{t("total")}</h3>
                <div className="summary-total">{money(total, locale)}</div>
                <p className="muted">{t("demoNotice")}</p>
                <Button onClick={() => setCheckout(true)}>
                  {t("checkout")}
                  <ArrowRight size={18} />
                </Button>
              </aside>
            </div>
          )}
        </main>
      )}
      {selected && (
        <ProductDetails
          product={selected}
          onClose={() => setSelected(null)}
          onAdd={(q) => add(selected, q)}
          onReserve={() => {
            setReserve(selected);
            setSelected(null);
          }}
        />
      )}
      {reserve && state.settings.reservations && (
        <Modal title={t("reserve")} onClose={() => setReserve(null)}>
          <h3>{reserve.name[locale] || reserve.name.en}</h3>
          <CustomerForm
            reservation={reserve}
            onSubmit={(v) => {
              if (v.quantity > available(state, reserve.id, v.salonId))
                return notify(t("stockError"));
              setState((s) => ({
                ...s,
                reservations: [
                  {
                    id: `RS-${Date.now().toString().slice(-7)}`,
                    name: v.name,
                    phone: v.phone,
                    salonId: v.salonId,
                    productId: reserve.id,
                    quantity: v.quantity,
                    status: "pending",
                    date: new Date().toISOString(),
                  },
                  ...s.reservations,
                ],
              }));
              notify(t("reservationSuccess"));
              setReserve(null);
            }}
          />
        </Modal>
      )}
      {checkout && state.settings.shopping && (
        <Modal title={t("checkout")} onClose={() => setCheckout(false)}>
          <p className="info-box">{t("demoNotice")}</p>
          <CustomerForm
            onSubmit={(v) => {
              try {
                setState(
                  placeOrder(state, {
                    id: `MR-${Date.now().toString().slice(-7)}`,
                    name: v.name,
                    phone: v.phone,
                    address: v.address,
                    salonId: v.salonId,
                    items: state.cart,
                    total,
                    fulfilment: v.fulfilment,
                    status: "pending",
                    date: new Date().toISOString(),
                  }),
                );
                setCheckout(false);
                notify(t("orderSuccess"));
              } catch {
                notify(t("stockError"));
              }
            }}
          />
        </Modal>
      )}
    </>
  );
}
export function ProductCard({
  product: p,
  index = 0,
  onView,
  onAdd,
}: {
  product: Product;
  index?: number;
  onView: () => void;
  onAdd: () => void;
}) {
  const t = useTranslations();
  const { locale, state, salonId } = useStore();
  const qty = available(state, p.id, salonId === "all" ? "s1" : salonId);
  return (
    <article className="product-card">
      <button className="product-image" onClick={onView}>
        <img src={p.image} alt={p.name[locale] || p.name.en} loading="lazy" />
        {index === 0 && (
          <span className="product-badge">{t("salonLoved")}</span>
        )}
        <span className="product-view">
          <ArrowUpRight size={20} />
        </span>
      </button>
      <div className="product-meta">
        <span>
          {t(categories[p.category])} · {p.variant}
        </span>
        <span className="rating">
          <Star size={11} fill="currentColor" />
          4.9
        </span>
      </div>
      <button className="product-name" onClick={onView}>
        <h3>{p.name[locale] || p.name.en}</h3>
      </button>
      <div className="product-bottom">
        <span>{money(p.price, locale)}</span>
        {state.settings.shopping ? (
          <button
            className="add-bag"
            disabled={!qty}
            onClick={onAdd}
            aria-label={`${t("addCart")} ${p.name[locale]}`}
          >
            <ShoppingBagIcon />
            {qty ? t("addCart") : t("outStock")}
          </button>
        ) : (
          <button className="text-link" onClick={onView}>
            {t("details")}
            <ArrowRight size={15} />
          </button>
        )}
      </div>
    </article>
  );
}
function ShoppingBagIcon() {
  return (
    <svg
      width="14"
      height="16"
      viewBox="0 0 20 22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M3 7h14l1 13H2L3 7Z" />
      <path d="M6 7V5a4 4 0 0 1 8 0v2" />
    </svg>
  );
}
function ProductDetails({
  product: p,
  onClose,
  onAdd,
  onReserve,
}: {
  product: Product;
  onClose: () => void;
  onAdd: (q: number) => void;
  onReserve: () => void;
}) {
  const t = useTranslations();
  const { state, locale, salonId, setSalonId } = useStore();
  const [q, setQ] = useState(1);
  const [gallery, setGallery] = useState(p.image);
  const qty = available(state, p.id, salonId === "all" ? "s1" : salonId);
  return (
    <Modal title={p.name[locale] || p.name.en} onClose={onClose} wide>
      <div className="detail-grid">
        <div>
          <img
            className="detail-image"
            src={gallery}
            alt={p.name[locale] || p.name.en}
          />
          <div className="thumbnails">
            {[
              p.image,
              state.products.find(
                (x) => x.category === p.category && x.id !== p.id,
              )?.image ?? p.image,
            ].map((url, i) => (
              <button key={i} onClick={() => setGallery(url)}>
                <img src={url} alt={`${p.name[locale]} ${i + 1}`} />
              </button>
            ))}
          </div>
        </div>
        <div className="detail-copy">
          <div className="eyebrow">{p.brand}</div>
          <h2>{p.name[locale] || p.name.en}</h2>
          <p>{p.description[locale] || p.description.en}</p>
          <Field label={t("variant")}>
            <select defaultValue={p.variant}>
              <option>{p.variant}</option>
            </select>
          </Field>
          <h3>{money(p.price, locale)}</h3>
          <Field label={t("salon")}>
            <select
              value={salonId === "all" ? "s1" : salonId}
              onChange={(e) => setSalonId(e.target.value)}
            >
              {state.salons
                .filter((s) => s.active && p.salons.includes(s.id))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {available(state, p.id, s.id)}
                  </option>
                ))}
            </select>
          </Field>
          <p
            className={`stock ${qty === 0 ? "danger" : qty <= 5 ? "warning" : ""}`}
          >
            <Check size={14} />
            {t(
              qty === 0 ? "outStock" : qty <= 5 ? "lowStock" : "inStock",
            )} · {qty}
          </p>
          <Stepper value={q} min={1} max={qty} onChange={setQ} />
          {state.settings.shopping && (
            <Button disabled={!qty || q > qty} onClick={() => onAdd(q)}>
              {t("addCart")}
              <ArrowRight size={17} />
            </Button>
          )}
          {state.settings.reservations && (
            <Button variant="outline" disabled={!qty} onClick={onReserve}>
              {t("reserve")}
              <MapPin size={17} />
            </Button>
          )}
          <small className="muted">SKU: {p.sku}</small>
        </div>
      </div>
    </Modal>
  );
}

