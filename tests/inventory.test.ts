import { test } from "node:test";
import assert from "node:assert/strict";
import {
  seed,
  available,
  key,
  placeOrder,
  transitionReservation,
  type Order,
} from "../src/lib/model";
import { messages } from "../src/lib/messages";
test("seed has consistent relationships and required demo size", () => {
  const s = seed();
  assert.equal(s.salons.length, 10);
  assert.equal(s.products.length, 48);
  assert.equal(s.employees.length, 60);
  for (const p of s.products)
    for (const sid of p.salons) assert.ok(s.inventory[key(p.id, sid)]);
});
test("orders deduct selected salon once and reject overselling", () => {
  const s = seed();
  const before = available(s, "p1", "s1");
  const other = available(s, "p1", "s2");
  const order: Order = {
    id: "o1",
    name: "Test",
    phone: "9876543210",
    address: "",
    salonId: "s1",
    items: [{ productId: "p1", quantity: 2 }],
    total: 2500,
    status: "pending",
    fulfilment: "pickup",
    date: new Date().toISOString(),
  };
  const next = placeOrder(s, order);
  assert.equal(available(next, "p1", "s1"), before - 2);
  assert.equal(available(next, "p1", "s2"), other);
  assert.equal(next.cart.length, 0);
  assert.equal(
    available(
      {
        ...next,
        orders: next.orders.map((o) => ({ ...o, status: "completed" })),
      },
      "p1",
      "s1",
    ),
    before - 2,
  );
  assert.throws(() =>
    placeOrder(s, {
      ...order,
      items: [{ productId: "p1", quantity: before + 1 }],
    }),
  );
  assert.throws(() =>
    placeOrder(s, { ...order, items: [{ productId: "p1", quantity: -2 }] }),
  );
  assert.equal(available(s, "p1", "s1"), before);
});
test("confirmation holds stock, cancellation releases it, collection deducts once", () => {
  let s = seed();
  const before = available(s, "p1", "s2");
  s = transitionReservation(s, "RS-2041", "confirmed");
  assert.equal(available(s, "p1", "s2"), before - 1);
  const cancelled = transitionReservation(s, "RS-2041", "cancelled");
  assert.equal(available(cancelled, "p1", "s2"), before);
  s = transitionReservation(s, "RS-2041", "collected");
  assert.equal(available(s, "p1", "s2"), before - 1);
  const again = transitionReservation(s, "RS-2041", "collected");
  assert.equal(available(again, "p1", "s2"), before - 1);
  assert.throws(() => transitionReservation(s, "RS-2041", "confirmed"));
});
test("pending reservation requires confirmation and stock is checked again", () => {
  const s = seed();
  assert.throws(() => transitionReservation(s, "RS-2041", "collected"));
  s.inventory[key("p1", "s2")].quantity = 0;
  assert.throws(() => transitionReservation(s, "RS-2041", "confirmed"));
});
test("all four locales have every interface key and localized product content", () => {
  const keys = Object.keys(messages.en).sort();
  for (const locale of ["en", "mr", "te", "kn"] as const) {
    assert.deepEqual(Object.keys(messages[locale]).sort(), keys);
    assert.ok(Object.values(messages[locale]).every(Boolean));
    for (const p of seed().products) {
      assert.ok(p.name[locale]);
      assert.ok(p.description[locale]);
    }
  }
});
