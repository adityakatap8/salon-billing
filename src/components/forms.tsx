"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { ArrowRight, Check, Eye, Plus, Save } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  available,
  key,
  localized,
  photos,
  type Product,
  type Locale,
  type Salon,
  type Employee,
} from "@/lib/model";
import { categories, localeNames } from "@/lib/messages";
import { Button, Field, Modal } from "./ui";
export type CustomerValues = {
  name: string;
  phone: string;
  address: string;
  salonId: string;
  quantity: number;
  fulfilment: string;
};
export function CustomerForm({
  reservation,
  onSubmit,
}: {
  reservation?: Product;
  onSubmit: (v: CustomerValues) => void;
}) {
  const t = useTranslations();
  const { state, salonId, locale } = useStore();
  const schema = z
    .object({
      name: z.string().trim().min(2, t("required")),
      phone: z.string().regex(/^[+\d\s()-]{7,16}$/, t("invalidPhone")),
      address: z.string(),
      salonId: z.string().min(1),
      quantity: z.number().int().min(1),
      fulfilment: z.string(),
    })
    .refine(
      (v) =>
        reservation ||
        v.fulfilment !== "delivery" ||
        v.address.trim().length >= 5,
      { path: ["address"], message: t("required") },
    );
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CustomerValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      salonId: salonId === "all" ? "s1" : salonId,
      quantity: 1,
      fulfilment: "pickup",
    },
  });
  const values = watch();
  const stock = reservation
    ? available(state, reservation.id, values.salonId)
    : 0;
  return (
    <form className="form" onSubmit={handleSubmit(onSubmit)}>
      <Field label={t("name")}>
        <input autoComplete="name" {...register("name")} />
        {errors.name && <small className="error">{errors.name.message}</small>}
      </Field>
      <Field label={t("phone")}>
        <input type="tel" autoComplete="tel" {...register("phone")} />
        {errors.phone && (
          <small className="error">{errors.phone.message}</small>
        )}
      </Field>
      <Field label={t("salon")}>
        <select {...register("salonId")}>
          {state.salons
            .filter(
              (s) =>
                s.active && (!reservation || reservation.salons.includes(s.id)),
            )
            .map((s) => (
              <option value={s.id} key={s.id}>
                {s.name}
              </option>
            ))}
        </select>
      </Field>
      {reservation ? (
        <>
          <p className="info-box">
            {t("available")}: {stock.toLocaleString(locale)}
          </p>
          <Field label={t("quantity")}>
            <input
              type="number"
              min="1"
              max={stock}
              {...register("quantity", { valueAsNumber: true })}
            />
          </Field>
        </>
      ) : (
        <>
          <Field label={t("fulfilment")}>
            <select {...register("fulfilment")}>
              <option value="pickup">{t("pickup")}</option>
              <option value="delivery">{t("delivery")}</option>
            </select>
          </Field>
          {values.fulfilment === "delivery" && (
            <Field label={t("address")}>
              <textarea
                autoComplete="street-address"
                {...register("address")}
              />
              {errors.address && (
                <small className="error">{errors.address.message}</small>
              )}
            </Field>
          )}
        </>
      )}
      <Button type="submit" disabled={!!reservation && stock < 1}>
        {t(reservation ? "reserve" : "placeOrder")}
        <ArrowRight size={17} />
      </Button>
    </form>
  );
}
export function ProductForm({
  product,
  onClose,
}: {
  product?: Product;
  onClose: () => void;
}) {
  const t = useTranslations();
  const { state, setState, locale, notify, role, salonId } = useStore();
  const [language, setLanguage] = useState<Locale>(locale);
  const [item, setItem] = useState<Product>(
    product
      ? structuredClone(product)
      : {
          id: `p${Date.now()}`,
          businessId: "maison",
          name: localized("", "", "", ""),
          description: localized("", "", "", ""),
          category: 0,
          brand: "Maison Rosé",
          price: 1250,
          sku: `MR-${Date.now().toString().slice(-6)}`,
          image: photos[0],
          variant: "250 ml",
          featured: false,
          visible: true,
          archived: false,
          salons: role === "owner" ? state.salons.map((s) => s.id) : [salonId],
        },
  );
  const [stocks, setStocks] = useState<Record<string, number>>(
    Object.fromEntries(
      state.salons.map((s) => [
        s.id,
        product ? (state.inventory[key(product.id, s.id)]?.quantity ?? 0) : 10,
      ]),
    ),
  );
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);
  const salons = state.salons.filter(
    (s) => role === "owner" || s.id === salonId,
  );
  const change = (field: keyof Product, value: Product[keyof Product]) =>
    setItem((i) => ({ ...i, [field]: value }));
  function save() {
    if (
      !item.name.en.trim() ||
      !item.description.en.trim() ||
      item.price < 0 ||
      !Number.isFinite(item.price) ||
      !item.salons.length ||
      Object.values(stocks).some((n) => !Number.isInteger(n) || n < 0)
    ) {
      setError(t("required"));
      return;
    }
    if (
      product &&
      salons.some(
        (s) =>
          (item.salons.includes(s.id) ? stocks[s.id] : 0) <
          (state.inventory[key(product.id, s.id)]?.quantity ?? 0) -
            available(state, product.id, s.id),
      )
    ) {
      setError(t("stockError"));
      return;
    }
    setState((s) => {
      const inventory = { ...s.inventory };
      for (const salon of salons) {
        const k = key(item.id, salon.id);
        inventory[k] = {
          quantity: item.salons.includes(salon.id) ? stocks[salon.id] : 0,
          threshold: inventory[k]?.threshold ?? 5,
        };
      }
      return {
        ...s,
        inventory,
        draft: {...s.draft, featured: item.featured ? Array.from(new Set([...s.draft.featured, item.id])) : s.draft.featured.filter(id => id !== item.id)},
        products: product
          ? s.products.map((p) => (p.id === item.id ? item : p))
          : [item, ...s.products],
      };
    });
    notify(t("saved"));
    onClose();
  }
  return (
    <Modal title={t(product ? "edit" : "addProduct")} onClose={onClose} wide>
      <div className="form-grid">
        <div className="form">
          <Field label={t("language")}>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Locale)}
            >
              {Object.entries(localeNames).map(([l, n]) => (
                <option value={l} key={l}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          {language !== "en" &&
            (!item.name[language] || !item.description[language]) && (
              <div className="info-box">{t("translationMissing")}</div>
            )}
          <Field label={t("name")}>
            <input
              value={item.name[language]}
              placeholder={item.name.en}
              onChange={(e) =>
                change("name", { ...item.name, [language]: e.target.value })
              }
            />
          </Field>
          <Field label={t("description")}>
            <textarea
              rows={4}
              value={item.description[language]}
              placeholder={item.description.en}
              onChange={(e) =>
                change("description", {
                  ...item.description,
                  [language]: e.target.value,
                })
              }
            />
          </Field>
          <div className="two-cols">
            <Field label={t("category")}>
              <select
                value={item.category}
                onChange={(e) => change("category", +e.target.value)}
              >
                {categories.map((c, i) => (
                  <option value={i} key={c}>
                    {t(c)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={`${t("price")} (₹)`}>
              <input
                type="number"
                min="0"
                value={item.price}
                onChange={(e) => change("price", +e.target.value)}
              />
            </Field>
          </div>
          <Field label={t("image")}>
            <input
              type="url"
              value={item.image}
              onChange={(e) => change("image", e.target.value)}
            />
          </Field>
          <details>
            <summary>{t("advanced")}</summary>
            <Field label={t("brand")}>
              <input
                value={item.brand}
                onChange={(e) => change("brand", e.target.value)}
              />
            </Field>
            <Field label="SKU">
              <input
                value={item.sku}
                onChange={(e) => change("sku", e.target.value)}
              />
            </Field>
            <Field label={t("variant")}>
              <input
                value={item.variant}
                onChange={(e) => change("variant", e.target.value)}
              />
            </Field>
          </details>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={item.visible}
              onChange={(e) => change("visible", e.target.checked)}
            />
            {t("visible")}
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={item.featured}
              onChange={(e) => change("featured", e.target.checked)}
            />
            {t("featured")}
          </label>
        </div>
        <div>
          <img className="form-product-image" src={item.image} alt="" />
          <h3>{t("assigned")}</h3>
          <p className="muted">{t("initialStock")}</p>
          <div className="stock-assignment">
            {salons.map((s) => (
              <div key={s.id}>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={item.salons.includes(s.id)}
                    onChange={(e) =>
                      change(
                        "salons",
                        e.target.checked
                          ? [...item.salons, s.id]
                          : item.salons.filter((id) => id !== s.id),
                      )
                    }
                  />
                  {s.city}
                </label>
                <input
                  aria-label={`${t("quantity")} ${s.name}`}
                  type="number"
                  min="0"
                  value={stocks[s.id]}
                  disabled={!item.salons.includes(s.id)}
                  onChange={(e) =>
                    setStocks((v) => ({ ...v, [s.id]: +e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <Button variant="outline" onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button variant="outline" onClick={() => setPreview(true)}>
          <Eye size={16} />
          {t("preview")}
        </Button>
        <Button onClick={save}>
          <Save size={16} />
          {t("save")}
        </Button>
      </div>
      {preview && (
        <Modal title={t("preview")} onClose={() => setPreview(false)}>
          <img className="form-product-image" src={item.image} alt="" />
          <h2>{item.name[language] || item.name.en}</h2>
          <p>{item.description[language] || item.description.en}</p>
          <strong>₹{item.price}</strong>
        </Modal>
      )}
    </Modal>
  );
}
export function SalonForm({
  salon,
  onClose,
}: {
  salon?: Salon;
  onClose: () => void;
}) {
  const t = useTranslations();
  const { setState, notify } = useStore();
  const [item, setItem] = useState<Salon>(
    salon ?? {
      id: `s${Date.now()}`,
      businessId: "maison",
      name: "",
      city: "",
      address: "",
      manager: "",
      phone: "",
      active: true,
    },
  );
  return (
    <Modal title={t(salon ? "edit" : "addSalon")} onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          setState((s) => ({
            ...s,
            salons: salon
              ? s.salons.map((x) => (x.id === item.id ? item : x))
              : [...s.salons, item],
          }));
          notify(t("saved"));
          onClose();
        }}
      >
        {(["name", "city", "address", "manager", "phone"] as const).map((f) => (
          <Field key={f} label={t(f)}>
            <input
              type={f === "phone" ? "tel" : "text"}
              required
              value={item[f]}
              onChange={(e) => setItem({ ...item, [f]: e.target.value })}
            />
          </Field>
        ))}
        <Button type="submit">
          <Check size={16} />
          {t("save")}
        </Button>
      </form>
    </Modal>
  );
}
export function EmployeeForm({
  employee,
  salon,
  onClose,
}: {
  employee?: Employee;
  salon: string;
  onClose: () => void;
}) {
  const t = useTranslations();
  const { state, setState, notify, role } = useStore();
  const [item, setItem] = useState<Employee>(
    employee ?? {
      id: `e${Date.now()}`,
      name: "",
      phone: "",
      role: "employee",
      salonId: salon,
      active: true,
    },
  );
  return (
    <Modal title={t(employee ? "edit" : "addEmployee")} onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          setState((s) => ({
            ...s,
            employees: employee
              ? s.employees.map((x) => (x.id === item.id ? item : x))
              : [...s.employees, item],
          }));
          notify(t("saved"));
          onClose();
        }}
      >
        <Field label={t("name")}>
          <input
            required
            value={item.name}
            onChange={(e) => setItem({ ...item, name: e.target.value })}
          />
        </Field>
        <Field label={t("phone")}>
          <input
            type="tel"
            pattern="[+0-9 ()-]{7,16}"
            required
            value={item.phone}
            onChange={(e) => setItem({ ...item, phone: e.target.value })}
          />
        </Field>
        <Field label={t("role")}>
          <select
            value={item.role}
            onChange={(e) =>
              setItem({ ...item, role: e.target.value as Employee["role"] })
            }
          >
            {(role === "owner"
              ? ["owner", "manager", "employee"]
              : ["manager", "employee"]
            ).map((r) => (
              <option key={r} value={r}>
                {t(r)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("salon")}>
          <select
            value={item.salonId}
            onChange={(e) => setItem({ ...item, salonId: e.target.value })}
          >
            {state.salons
              .filter((s) => role === "owner" || s.id === salon)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </Field>
        <Button type="submit">
          <Plus size={16} />
          {t("save")}
        </Button>
      </form>
    </Modal>
  );
}
