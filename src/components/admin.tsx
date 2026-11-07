"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Check,
  Copy,
  Edit3,
  Eye,
  ImagePlus,
  MapPin,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Users,
  Archive,
  Trash2,
  History,
  ArrowLeftRight,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  available,
  key,
  transitionReservation,
  type Product,
  type Salon,
  type Employee,
  type Reservation,
} from "@/lib/model";
import { categories } from "@/lib/messages";
import { Button, Empty, Field, Modal, Stepper } from "./ui";
import { ProductForm, SalonForm, EmployeeForm } from "./forms";
import { money } from "./storefront";
import { Editor, SettingsPage } from "./editor";
export function Admin({ page, go }: { page: string; go: (p: string) => void }) {
  const t = useTranslations();
  const { state, role, salonId, locale } = useStore();
  const [productForm, setProductForm] = useState<Product | null | undefined>(
    undefined,
  );
  const [stockTab, setStockTab] = useState(false);
  const low = state.products.filter(
    (p) =>
      !p.archived &&
      p.salons.some(
        (id) =>
          (salonId === "all" || id === salonId) &&
          available(state, p.id, id) <=
            (state.inventory[key(p.id, id)]?.threshold ?? 5),
      ),
  );
  const pending =
    state.orders.filter(
      (o) =>
        o.status === "pending" && (salonId === "all" || o.salonId === salonId),
    ).length +
    state.reservations.filter(
      (r) =>
        r.status === "pending" && (salonId === "all" || r.salonId === salonId),
    ).length;
  return (
    <main className="admin-main">
      {page === "home" && (
        <>
          <div className="admin-page-title">
            <div>
              <div className="eyebrow">
                {t("welcome")}, {t("ownerName").split(" ")[0]} ☀
              </div>
              <h1>{t("overview")}</h1>
              <p>
                {state.salons.find((s) => s.id === salonId)?.name ??
                  t("allSalons")}{" "}
                <span>·</span>{" "}
                {new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
                  new Date("2026-10-31T12:00:00"),
                )}
              </p>
            </div>
            {role === "owner" && (
              <Button variant="outline" onClick={() => go("editor")}>
                <Eye size={16} />
                {t("editWebsite")}
              </Button>
            )}
          </div>
          <div className="stat-grid">
            {[
              {
                label: "totalSalons",
                value: role === "owner" ? state.salons.length : 1,
                icon: Building2,
              },
              {
                label: "totalProducts",
                value: state.products.filter(
                  (p) =>
                    !p.archived &&
                    (salonId === "all" || p.salons.includes(salonId)),
                ).length,
                icon: Package,
              },
              { label: "lowStock", value: low.length, icon: AlertCircle },
              { label: "pending", value: pending, icon: ShoppingBag },
            ].map((s, i) => (
              <button
                className={`stat-card stat-${i}`}
                key={s.label}
                onClick={() => {
                  if (i === 2) setStockTab(true);
                  go(
                    i === 0 && role !== "employee"
                      ? "salons"
                      : i === 3
                        ? "orders"
                        : "products",
                  );
                }}
              >
                <div>
                  <span>{t(s.label)}</span>
                  <s.icon size={20} />
                </div>
                <strong>{s.value.toLocaleString(locale)}</strong>
                <small>
                  {t("details")}
                  <ArrowUpRight size={13} />
                </small>
              </button>
            ))}
          </div>
          <section className="admin-section">
            <h2>{t("quick")}</h2>
            <div className="quick-grid">
              {[
                {
                  label: "addProduct",
                  icon: Plus,
                  action: () => setProductForm(null),
                  hide: role === "employee",
                },
                {
                  label: "updateStock",
                  icon: Package,
                  action: () => {
                    setStockTab(true);
                    go("products");
                  },
                },
                {
                  label: "manageSalons",
                  icon: Building2,
                  action: () => go("salons"),
                  hide: role === "employee",
                },
                {
                  label: "editWebsite",
                  icon: ImagePlus,
                  action: () => go("editor"),
                  hide: role !== "owner",
                },
              ]
                .filter((x) => !x.hide)
                .map((a) => (
                  <button
                    className="quick-card"
                    key={a.label}
                    onClick={a.action}
                  >
                    <span>
                      <a.icon size={21} />
                    </span>
                    {t(a.label)}
                    <ArrowUpRight size={17} />
                  </button>
                ))}
            </div>
          </section>
          <div className="dashboard-lower">
            <section className="panel">
              <div className="panel-title">
                <h2>{t("attention")}</h2>
                <span className="count-badge">{low.length + pending}</span>
              </div>
              {low.slice(0, 3).map((p) => (
                <button
                  className="attention-row"
                  key={p.id}
                  onClick={() => {
                    setStockTab(true);
                    go("products");
                  }}
                >
                  <span className="attention-icon">
                    <AlertCircle size={18} />
                  </span>
                  <div>
                    <strong>{p.name[locale] || p.name.en}</strong>
                    <small>{t("stockNotice")}</small>
                  </div>
                  <ArrowRight size={17} />
                </button>
              ))}
              {pending > 0 && (
                <button className="attention-row" onClick={() => go("orders")}>
                  <span className="attention-icon rose">
                    <ShoppingBag size={18} />
                  </span>
                  <div>
                    <strong>
                      {pending} {t("pending")}
                    </strong>
                    <small>{t("pendingNotice")}</small>
                  </div>
                  <ArrowRight size={17} />
                </button>
              )}
            </section>
            <section className="dashboard-note">
              <span>✧</span>
              <div className="eyebrow">MAISON ROSÉ</div>
              <h2>{t("ritual")}</h2>
              <p>{t("footer")}</p>
              <Button variant="outline" onClick={() => go("products")}>
                {t("catalogue")}
                <ArrowRight size={16} />
              </Button>
            </section>
          </div>
        </>
      )}
      {page === "products" && (
        <Products
          inventoryInitially={stockTab}
          onAdd={() => setProductForm(null)}
          onEdit={setProductForm}
        />
      )}
      {page === "salons" && role !== "employee" && (
        <Salons
          onInventory={(id) => {
            void id;
            setStockTab(true);
            go("products");
          }}
        />
      )}
      {page === "orders" && <Orders />}
      {page === "settings" && role === "owner" && <SettingsPage />}
      {page === "editor" && role === "owner" && <Editor go={go} />}
      {productForm !== undefined && (
        <ProductForm
          product={productForm ?? undefined}
          onClose={() => setProductForm(undefined)}
        />
      )}
    </main>
  );
}
function Products({
  inventoryInitially,
  onAdd,
  onEdit,
}: {
  inventoryInitially: boolean;
  onAdd: () => void;
  onEdit: (p: Product) => void;
}) {
  const t = useTranslations();
  const { state, setState, salonId, role, locale, notify } = useStore();
  const [tab, setTab] = useState(
    inventoryInitially ? "inventory" : "catalogue",
  );
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(-1);
  const [archived, setArchived] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const sid = salonId === "all" ? "s1" : salonId;
  const canEdit = role === "owner" || role === "manager";
  const list = state.products.filter(
    (p) =>
      (archived ? p.archived : !p.archived) &&
      (salonId === "all" || p.salons.includes(salonId)) &&
      (category < 0 || p.category === category) &&
      (p.name[locale] || p.name.en)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  function duplicate(p: Product) {
    const id = `p${Date.now()}`;
    setState((s) => {
      const inventory = { ...s.inventory };
      p.salons.forEach((sid) => {
        inventory[key(id, sid)] = { quantity: 0, threshold: 5 };
      });
      return {
        ...s,
        inventory,
        products: [
          {
            ...structuredClone(p),
            id,
            sku: `MR-${Date.now().toString().slice(-6)}`,
            visible: false,
            featured: false,
          },
          ...s.products,
        ],
      };
    });
    notify(t("saved"));
  }
  return (
    <>
      <div className="admin-page-title">
        <div>
          <div className="eyebrow">{t("manage")}</div>
          <h1>{t("products")}</h1>
          <p>
            {t("catalogue")} ·{" "}
            {state.products.filter((p) => !p.archived).length}
          </p>
        </div>
        {canEdit && (
          <Button onClick={onAdd}>
            <Plus size={18} />
            {t("addProduct")}
          </Button>
        )}
      </div>
      <div className="tabs">
        {["catalogue", "inventory"].map((x) => (
          <button
            key={x}
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
          >
            {t(x)}
          </button>
        ))}
      </div>
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
        <select
          aria-label={t("category")}
          value={category}
          onChange={(e) => setCategory(+e.target.value)}
        >
          <option value="-1">{t("all")}</option>
          {categories.map((c, i) => (
            <option value={i} key={c}>
              {t(c)}
            </option>
          ))}
        </select>
        {canEdit && (
          <label className="checkbox">
            <input
              type="checkbox"
              checked={archived}
              onChange={(e) => setArchived(e.target.checked)}
            />
            {t("viewArchived")}
          </label>
        )}
      </div>
      {tab === "inventory" && salonId === "all" && (
        <p className="info-box">
          {state.salons.find((s) => s.id === sid)?.name} · {t("salon")}
        </p>
      )}
      <div className="management-list">
        {list.map((p) => {
          const qty = available(state, p.id, sid);
          const threshold = state.inventory[key(p.id, sid)]?.threshold ?? 5;
          return (
            <article className="management-row" key={p.id}>
              <img src={p.image} alt="" />
              <div className="management-product">
                <h3>{p.name[locale] || p.name.en}</h3>
                <small>
                  {p.sku} · {t(categories[p.category])}
                </small>
                <span
                  className={`stock ${qty === 0 ? "danger" : qty <= threshold ? "warning" : ""}`}
                >
                  {t(
                    qty === 0
                      ? "outStock"
                      : qty <= threshold
                        ? "lowStock"
                        : "inStock",
                  )}{" "}
                  · {qty}
                </span>
              </div>
              <div className="row-price">
                {money(p.price, locale)}
                <small>{p.variant}</small>
              </div>
              <div className="row-actions">
                {tab === "inventory" ? (
                  <Button
                    variant="outline"
                    disabled={
                      role === "employee" && !state.settings.employeeStock
                    }
                    onClick={() => setStockProduct(p)}
                  >
                    <Package size={16} />
                    {t("updateStock")}
                  </Button>
                ) : canEdit ? (
                  <>
                    <Button variant="outline" onClick={() => onEdit(p)}>
                      <Edit3 size={15} />
                      {t("edit")}
                    </Button>
                    <button
                      className="icon-button"
                      aria-label={t("duplicate")}
                      onClick={() => duplicate(p)}
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={t(p.archived ? "restoreProduct" : "archive")}
                      onClick={() => {
                        setState((s) => ({
                          ...s,
                          products: s.products.map((x) =>
                            x.id === p.id ? { ...x, archived: !x.archived } : x,
                          ),
                        }));
                        notify(t("saved"));
                      }}
                    >
                      <Archive size={16} />
                    </button>
                    {role === "owner" && (
                      <button
                        className="icon-button danger"
                        aria-label={t("delete")}
                        onClick={() => setConfirm(p.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </>
                ) : (
                  <Button
                    variant="outline"
                    disabled={!state.settings.employeeStock}
                    onClick={() => setStockProduct(p)}
                  >
                    {t("updateStock")}
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {!list.length && <Empty text={t("noResults")} />}
      {stockProduct && (
        <StockEditor
          product={stockProduct}
          salon={sid}
          onClose={() => setStockProduct(null)}
        />
      )}
      {confirm && (
        <Modal title={t("delete")} onClose={() => setConfirm(null)}>
          <p>{t("confirmDelete")}</p>
          <div className="form-actions">
            <Button variant="outline" onClick={() => setConfirm(null)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={() => {
                setState((s) => ({
                  ...s,
                  products: s.products.filter((p) => p.id !== confirm),
                  cart: s.cart.filter((l) => l.productId !== confirm),
                }));
                setConfirm(null);
                notify(t("saved"));
              }}
            >
              {t("delete")}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
function StockEditor({
  product: p,
  salon,
  onClose,
}: {
  product: Product;
  salon: string;
  onClose: () => void;
}) {
  const t = useTranslations();
  const { state, setState, role, notify } = useStore();
  const [sid, setSid] = useState(salon);
  const current = state.inventory[key(p.id, sid)] ?? {
    quantity: 0,
    threshold: 5,
  };
  const [quantity, setQuantity] = useState(current.quantity);
  const [threshold, setThreshold] = useState(current.threshold);
  const [reason, setReason] = useState("");
  const [destination, setDestination] = useState(
    state.salons.find((s) => s.id !== salon)?.id ?? "",
  );
  const [transferQty, setTransferQty] = useState(1);
  const [tab, setTab] = useState("updateStock");
  const [error, setError] = useState("");
  const held = current.quantity - available(state, p.id, sid);
  function save() {
    if (
      !reason.trim() ||
      quantity < held ||
      !Number.isInteger(quantity) ||
      quantity < 0 ||
      !Number.isInteger(threshold) ||
      threshold < 0
    ) {
      setError(quantity < held ? t("stockError") : t("required"));
      return;
    }
    setState((s) => ({
      ...s,
      inventory: { ...s.inventory, [key(p.id, sid)]: { quantity, threshold } },
      history: [
        {
          id: `h${Date.now()}`,
          productId: p.id,
          salonId: sid,
          change: quantity - current.quantity,
          reason,
          date: new Date().toISOString(),
        },
        ...s.history,
      ],
    }));
    notify(t("saved"));
    onClose();
  }
  function transfer() {
    if (
      destination === sid ||
      !Number.isInteger(transferQty) ||
      transferQty < 1 ||
      transferQty > available(state, p.id, sid)
    ) {
      setError(t("stockError"));
      return;
    }
    setState((s) => {
      const from = key(p.id, sid),
        to = key(p.id, destination);
      const history = [
        {
          id: `h${Date.now()}`,
          productId: p.id,
          salonId: sid,
          change: -transferQty,
          reason: t("transferReason"),
          date: new Date().toISOString(),
        },
        {
          id: `h${Date.now()}b`,
          productId: p.id,
          salonId: destination,
          change: transferQty,
          reason: t("transferReason"),
          date: new Date().toISOString(),
        },
      ];
      return {
        ...s,
        products: s.products.map((x) =>
          x.id === p.id
            ? { ...x, salons: Array.from(new Set([...x.salons, destination])) }
            : x,
        ),
        inventory: {
          ...s.inventory,
          [from]: {
            ...s.inventory[from],
            quantity: s.inventory[from].quantity - transferQty,
          },
          [to]: {
            threshold: s.inventory[to]?.threshold ?? 5,
            quantity: (s.inventory[to]?.quantity ?? 0) + transferQty,
          },
        },
        history: [...history, ...s.history],
      };
    });
    notify(t("saved"));
    onClose();
  }
  return (
    <Modal title={t("updateStock")} onClose={onClose}>
      <h3>{p.name.en}</h3>
      <div className="tabs">
        {(role === "owner"
          ? ["updateStock", "transfer", "history"]
          : ["updateStock", "history"]
        ).map((x) => (
          <button
            key={x}
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
          >
            {t(x)}
          </button>
        ))}
      </div>
      {tab !== "history" && (
        <Field label={t("salon")}>
          <select
            value={sid}
            onChange={(e) => {
              const id = e.target.value;
              setSid(id);
              setQuantity(state.inventory[key(p.id, id)]?.quantity ?? 0);
              setThreshold(state.inventory[key(p.id, id)]?.threshold ?? 5);
            }}
          >
            {state.salons
              .filter(
                (s) =>
                  p.salons.includes(s.id) &&
                  (role === "owner" || s.id === salon),
              )
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </Field>
      )}
      {tab === "updateStock" && (
        <div className="form">
          <Field label={t("quantity")}>
            <Stepper value={quantity} min={held} onChange={setQuantity} />
            <input
              type="number"
              min={held}
              value={quantity}
              onChange={(e) => setQuantity(+e.target.value)}
            />
          </Field>
          <Field label={t("threshold")}>
            <input
              type="number"
              min="0"
              value={threshold}
              onChange={(e) => setThreshold(+e.target.value)}
            />
          </Field>
          <Field label={t("reason")}>
            <input
              required
              value={reason}
              placeholder={t("stockReason")}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
          <Button onClick={save}>
            {t("save")}
            <Check size={16} />
          </Button>
        </div>
      )}
      {tab === "transfer" && (
        <div className="form">
          <Field label={t("toSalon")}>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              {state.salons
                .filter((s) => s.id !== sid && s.active)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label={t("quantity")}>
            <Stepper
              value={transferQty}
              min={1}
              max={available(state, p.id, sid)}
              onChange={setTransferQty}
            />
          </Field>
          <Button onClick={transfer}>
            <ArrowLeftRight size={17} />
            {t("transfer")}
          </Button>
        </div>
      )}
      {tab === "history" && (
        <div>
          {state.history
            .filter((h) => h.productId === p.id)
            .map((h) => (
              <div className="history-row" key={h.id}>
                <History size={16} />
                <div>
                  <strong>
                    {h.change > 0 ? "+" : ""}
                    {h.change} ·{" "}
                    {state.salons.find((s) => s.id === h.salonId)?.city}
                  </strong>
                  <p>{h.reason}</p>
                  <small>{new Date(h.date).toLocaleString()}</small>
                </div>
              </div>
            ))}
          {!state.history.some((h) => h.productId === p.id) && (
            <Empty text={t("empty")} />
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </Modal>
  );
}
function Salons({ onInventory }: { onInventory: (id: string) => void }) {
  const t = useTranslations();
  const { state, setState, role, salonId, setSalonId, notify } = useStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [salonForm, setSalonForm] = useState<Salon | null | undefined>();
  const [employeeForm, setEmployeeForm] = useState<
    Employee | null | undefined
  >();
  const salon = state.salons.find((s) => s.id === selected);
  const list = state.salons.filter((s) => role === "owner" || s.id === salonId);
  return (
    <>
      <div className="admin-page-title">
        <div>
          <div className="eyebrow">{t("personal")}</div>
          <h1>{salon ? salon.name : t("salons")}</h1>
          <p>{salon ? salon.address : t("ritualText")}</p>
        </div>
        {role === "owner" && (
          <Button onClick={() => setSalonForm(null)}>
            <Plus size={18} />
            {t("addSalon")}
          </Button>
        )}
      </div>
      {salon ? (
        <>
          <Button variant="ghost" onClick={() => setSelected(null)}>
            ← {t("back")}
          </Button>
          <div className="panel salon-detail">
            <div>
              <h2>{salon.name}</h2>
              <p>
                <MapPin size={16} />
                {salon.address}
              </p>
              <p>
                {t("manager")}: {salon.manager}
              </p>
              <p>{salon.phone}</p>
            </div>
            <div className="row-actions">
              <Button variant="outline" onClick={() => setSalonForm(salon)}>
                <Edit3 size={16} />
                {t("edit")}
              </Button>
              <Button
                onClick={() => {
                  setSalonId(salon.id);
                  onInventory(salon.id);
                }}
              >
                <Package size={16} />
                {t("inventory")}
              </Button>
            </div>
          </div>
          <div className="section-title">
            <h2>{t("employees")}</h2>
            <Button onClick={() => setEmployeeForm(null)}>
              <Plus size={16} />
              {t("addEmployee")}
            </Button>
          </div>
          <div className="employee-grid">
            {state.employees
              .filter((e) => e.salonId === salon.id)
              .map((e) => (
                <div className="employee-card panel" key={e.id}>
                  <div className="avatar">
                    {e.name
                      .split(" ")
                      .map((s) => s[0])
                      .join("")}
                  </div>
                  <div>
                    <h3>{e.name}</h3>
                    <p>
                      {t(e.role)} · {t(e.active ? "active" : "inactive")}
                    </p>
                    <a href={`tel:${e.phone}`}>{e.phone}</a>
                  </div>
                  <div className="row-actions">
                    <Button variant="ghost" onClick={() => setEmployeeForm(e)}>
                      {t("edit")}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setState((s) => ({
                          ...s,
                          employees: s.employees.map((x) =>
                            x.id === e.id ? { ...x, active: !x.active } : x,
                          ),
                        }));
                        notify(t("saved"));
                      }}
                    >
                      {t(e.active ? "deactivate" : "activate")}
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </>
      ) : (
        <div className="admin-salon-grid">
          {list.map((s) => {
            const alerts = state.products.filter(
              (p) =>
                p.salons.includes(s.id) && available(state, p.id, s.id) <= 5,
            ).length;
            return (
              <article className="panel admin-salon-card" key={s.id}>
                <div className="salon-card-top">
                  <div className="salon-icon">
                    <Building2 size={24} />
                  </div>
                  <span className={`status-pill ${s.active ? "" : "neutral"}`}>
                    {t(s.active ? "active" : "inactive")}
                  </span>
                </div>
                <h3>{s.name}</h3>
                <p>
                  <MapPin size={14} />
                  {s.city}
                </p>
                <p>
                  {t("manager")}: {s.manager}
                </p>
                <div className="salon-counts">
                  <span>
                    <Users size={15} />
                    {
                      state.employees.filter(
                        (e) => e.salonId === s.id && e.active,
                      ).length
                    }{" "}
                    {t("employees")}
                  </span>
                  <span>
                    <Package size={15} />
                    {
                      state.products.filter(
                        (p) => p.salons.includes(s.id) && !p.archived,
                      ).length
                    }
                  </span>
                </div>
                <div className="salon-alert">
                  <AlertCircle size={15} />
                  {alerts} {t("lowStock")}
                </div>
                <div className="row-actions">
                  <Button variant="outline" onClick={() => setSelected(s.id)}>
                    {t("details")}
                    <ArrowRight size={15} />
                  </Button>
                  {role === "owner" && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setState((x) => ({
                          ...x,
                          salons: x.salons.map((y) =>
                            y.id === s.id ? { ...y, active: !y.active } : y,
                          ),
                        }));
                        notify(t("saved"));
                      }}
                    >
                      {t(s.active ? "deactivate" : "activate")}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {salonForm !== undefined && (
        <SalonForm
          salon={salonForm ?? undefined}
          onClose={() => setSalonForm(undefined)}
        />
      )}
      {employeeForm !== undefined && salon && (
        <EmployeeForm
          employee={employeeForm ?? undefined}
          salon={salon.id}
          onClose={() => setEmployeeForm(undefined)}
        />
      )}
    </>
  );
}
function Orders() {
  const t = useTranslations();
  const { state, setState, salonId, locale, notify } = useStore();
  const [tab, setTab] = useState("orderTab");
  const [filter, setFilter] = useState("all");
  const [details, setDetails] = useState<string | null>(null);
  const orders = state.orders.filter(
    (o) =>
      (salonId === "all" || o.salonId === salonId) &&
      (filter === "all" || o.status === filter),
  );
  const reservations = state.reservations.filter(
    (r) =>
      (salonId === "all" || r.salonId === salonId) &&
      (filter === "all" || r.status === filter),
  );
  const orderStatuses = [
    "pending",
    "confirmed",
    "ready",
    "completed",
    "cancelled",
  ];
  const resStatuses = ["pending", "confirmed", "collected", "cancelled"];
  function changeRes(id: string, status: Reservation["status"]) {
    try {
      setState(transitionReservation(state, id, status));
      notify(t("saved"));
    } catch (e) {
      notify(t(e instanceof Error ? e.message : "stockError"));
    }
  }
  const detailOrder = state.orders.find((o) => o.id === details);
  const detailRes = state.reservations.find((o) => o.id === details);
  return (
    <>
      <div className="admin-page-title">
        <div>
          <div className="eyebrow">{t("manage")}</div>
          <h1>{t("orders")}</h1>
          <p>{t("pendingNotice")}</p>
        </div>
      </div>
      <div className="order-toolbar">
        <div className="tabs">
          {["orderTab", "reservations"].map((x) => (
            <button
              key={x}
              className={tab === x ? "active" : ""}
              onClick={() => {
                setTab(x);
                setFilter("all");
              }}
            >
              {t(x)}{" "}
              <span>
                {x === "orderTab"
                  ? state.orders.length
                  : state.reservations.length}
              </span>
            </button>
          ))}
        </div>
        <select
          aria-label={t("status")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {["all", ...(tab === "orderTab" ? orderStatuses : resStatuses)].map(
            (x) => (
              <option key={x} value={x}>
                {t(x)}
              </option>
            ),
          )}
        </select>
      </div>
      <div className="order-grid">
        {tab === "orderTab"
          ? orders.map((o) => (
              <article className="panel order-card" key={o.id}>
                <div className="order-card-head">
                  <span>{o.id}</span>
                  <span className="status-pill">{t(o.status)}</span>
                </div>
                <h3>{o.name}</h3>
                <p>{state.salons.find((s) => s.id === o.salonId)?.name}</p>
                {o.items.map((l) => (
                  <div className="order-line" key={l.productId}>
                    <span>
                      {state.products.find((p) => p.id === l.productId)?.name[
                        locale
                      ] ?? l.productId}
                    </span>
                    <strong>×{l.quantity}</strong>
                  </div>
                ))}
                <div className="order-card-foot">
                  <strong>{money(o.total, locale)}</strong>
                  <small>{new Date(o.date).toLocaleDateString(locale)}</small>
                </div>
                <div className="row-actions">
                  <Button variant="outline" onClick={() => setDetails(o.id)}>
                    {t("details")}
                  </Button>
                  <select
                    aria-label={`${t("status")} ${o.id}`}
                    value={o.status}
                    onChange={(e) => {
                      setState((s) => ({
                        ...s,
                        orders: s.orders.map((x) =>
                          x.id === o.id ? { ...x, status: e.target.value } : x,
                        ),
                      }));
                      notify(t("saved"));
                    }}
                  >
                    {orderStatuses.map((x) => (
                      <option key={x} value={x}>
                        {t(x)}
                      </option>
                    ))}
                  </select>
                </div>
              </article>
            ))
          : reservations.map((r) => (
              <article className="panel order-card" key={r.id}>
                <div className="order-card-head">
                  <span>{r.id}</span>
                  <span className="status-pill">{t(r.status)}</span>
                </div>
                <h3>{r.name}</h3>
                <p>{state.salons.find((s) => s.id === r.salonId)?.name}</p>
                <div className="order-line">
                  <span>
                    {state.products.find((p) => p.id === r.productId)?.name[
                      locale
                    ] ?? r.productId}
                  </span>
                  <strong>×{r.quantity}</strong>
                </div>
                <small>{new Date(r.date).toLocaleDateString(locale)}</small>
                <div className="row-actions">
                  <Button variant="outline" onClick={() => setDetails(r.id)}>
                    {t("details")}
                  </Button>
                  <select
                    disabled={
                      r.status === "collected" || r.status === "cancelled"
                    }
                    aria-label={`${t("status")} ${r.id}`}
                    value={r.status}
                    onChange={(e) =>
                      changeRes(r.id, e.target.value as Reservation["status"])
                    }
                  >
                    {resStatuses.map((x) => (
                      <option key={x} value={x}>
                        {t(x)}
                      </option>
                    ))}
                  </select>
                </div>
              </article>
            ))}
      </div>
      {!(tab === "orderTab" ? orders : reservations).length && (
        <Empty text={t("empty")} />
      )}
      {details && (
        <Modal title={t("details")} onClose={() => setDetails(null)}>
          <h3>{(detailOrder ?? detailRes)?.name}</h3>
          <p>{(detailOrder ?? detailRes)?.phone}</p>
          <p>{detailOrder?.address}</p>
          <p>
            {t("salon")}:{" "}
            {
              state.salons.find(
                (s) => s.id === (detailOrder ?? detailRes)?.salonId,
              )?.name
            }
          </p>
          <p>
            {t("status")}: {t((detailOrder ?? detailRes)?.status ?? "pending")}
          </p>
          {detailOrder && (
            <>
              <p>{t(detailOrder.fulfilment)}</p>
              <h3>{money(detailOrder.total, locale)}</h3>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
