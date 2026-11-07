export type Locale = "en" | "mr" | "te" | "kn";
export type Localized = Record<Locale, string>;
export type Role = "owner" | "manager" | "employee" | "customer";
export type Product = {
  id: string;
  businessId: string;
  name: Localized;
  description: Localized;
  category: number;
  brand: string;
  price: number;
  sku: string;
  image: string;
  variant: string;
  featured: boolean;
  visible: boolean;
  archived: boolean;
  salons: string[];
};
export type Salon = {
  id: string;
  businessId: string;
  name: string;
  city: string;
  address: string;
  manager: string;
  phone: string;
  active: boolean;
};
export type Employee = {
  id: string;
  name: string;
  phone: string;
  role: "owner" | "manager" | "employee";
  salonId: string;
  active: boolean;
};
export type Stock = { quantity: number; threshold: number };
export type Line = { productId: string; quantity: number };
export type Order = {
  id: string;
  name: string;
  phone: string;
  address: string;
  salonId: string;
  items: Line[];
  total: number;
  fulfilment: string;
  status: string;
  date: string;
};
export type Reservation = {
  id: string;
  name: string;
  phone: string;
  salonId: string;
  productId: string;
  quantity: number;
  status: "pending" | "confirmed" | "collected" | "cancelled";
  date: string;
};
export type Homepage = {
  title: Localized;
  subtitle: Localized;
  image: string;
  featured: string[];
  sections: { featured: boolean; categories: boolean; locations: boolean };
  heading: Localized;
};
export type State = {
  version: 1;
  business: string;
  accent: string;
  products: Product[];
  salons: Salon[];
  employees: Employee[];
  inventory: Record<string, Stock>;
  orders: Order[];
  reservations: Reservation[];
  cart: Line[];
  history: {
    id: string;
    productId: string;
    salonId: string;
    change: number;
    reason: string;
    date: string;
  }[];
  settings: {
    browsing: boolean;
    shopping: boolean;
    reservations: boolean;
    employeeStock: boolean;
  };
  published: Homepage;
  draft: Homepage;
  previous: Homepage | null;
};
export const key = (productId: string, salonId: string) =>
  `${productId}:${salonId}`;
export function available(s: State, productId: string, salonId: string) {
  const held = s.reservations
    .filter(
      (r) =>
        r.productId === productId &&
        r.salonId === salonId &&
        r.status === "confirmed",
    )
    .reduce((n, r) => n + r.quantity, 0);
  return Math.max(
    0,
    (s.inventory[key(productId, salonId)]?.quantity ?? 0) - held,
  );
}
export function placeOrder(s: State, order: Order): State {
  if (s.orders.some((existing) => existing.id === order.id)) return s;
  const totals = new Map<string, number>();
  for (const line of order.items) {
    totals.set(line.productId, (totals.get(line.productId) ?? 0) + line.quantity);
  }
  if (
    !s.settings.shopping ||
    !s.salons.some((salon) => salon.id === order.salonId && salon.active) ||
    !order.items.length ||
    order.items.some(
      (l) =>
        !Number.isInteger(l.quantity) ||
        l.quantity < 1 ||
        !s.products.some((p) => p.id === l.productId && p.visible && !p.archived && p.salons.includes(order.salonId)),
    ) ||
    [...totals].some(([id, quantity]) => quantity > available(s, id, order.salonId))
  )
    throw new Error("stockError");
  const inventory = { ...s.inventory };
  for (const [productId, quantity] of totals) {
    const k = key(productId, order.salonId);
    inventory[k] = {
      ...inventory[k],
      quantity: inventory[k].quantity - quantity,
    };
  }
  return { ...s, inventory, orders: [order, ...s.orders], cart: [] };
}
export function transitionReservation(
  s: State,
  id: string,
  status: Reservation["status"],
): State {
  const r = s.reservations.find((x) => x.id === id);
  if (!r || r.status === status) return s;
  if (r.status === "collected" || r.status === "cancelled")
    throw new Error("finalStatus");
  if (
    status === "confirmed" &&
    r.status === "pending" &&
    r.quantity > available(s, r.productId, r.salonId)
  )
    throw new Error("stockError");
  if (status === "collected" && r.status !== "confirmed")
    throw new Error("confirmFirst");
  const inventory = { ...s.inventory };
  if (status === "collected") {
    const k = key(r.productId, r.salonId);
    inventory[k] = {
      ...inventory[k],
      quantity: inventory[k].quantity - r.quantity,
    };
  }
  return {
    ...s,
    inventory,
    reservations: s.reservations.map((x) =>
      x.id === id ? { ...x, status } : x,
    ),
  };
}
export const localized = (
  en: string,
  mr: string,
  te: string,
  kn: string,
): Localized => ({ en, mr, te, kn });
export const photos = [
  "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=85",
  "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=85",
  "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&q=85",
  "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=85",
  "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=85",
  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=85",
];
export function seed(): State {
  const cities = [
    "Bandra, Mumbai",
    "Juhu, Mumbai",
    "Koregaon Park, Pune",
    "Baner, Pune",
    "Jubilee Hills, Hyderabad",
    "Banjara Hills, Hyderabad",
    "Indiranagar, Bengaluru",
    "Whitefield, Bengaluru",
    "Dharampeth, Nagpur",
    "Panaji, Goa",
  ];
  const salons: Salon[] = cities.map((city, i) => ({
    id: `s${i + 1}`,
    businessId: "maison",
    name: `Maison Rosé · ${city.split(",")[0]}`,
    city,
    address: `${12 + i * 7}, ${city}, India`,
    manager: [
      "Ananya Desai",
      "Meera Rao",
      "Priya Shah",
      "Kavya Patil",
      "Sana Reddy",
      "Riya Kapoor",
      "Aditi Shetty",
      "Nisha Menon",
      "Isha Joshi",
      "Tara Dsouza",
    ][i],
    phone: `98765000${String(i + 10)}`,
    active: true,
  }));
  const names = [
    localized(
      "Rose Ritual Shampoo",
      "गुलाब शाम्पू",
      "రోజ్ షాంపూ",
      "ಗುಲಾಬಿ ಶಾಂಪೂ",
    ),
    localized(
      "Barrier Restore Serum",
      "त्वचा पुनर्संचय सीरम",
      "చర్మ పునరుద్ధరణ సీరం",
      "ಚರ್ಮ ಪುನಃಸ್ಥಾಪನಾ ಸೀರಮ್",
    ),
    localized(
      "Velvet Lip Colour",
      "मखमली ओठांचा रंग",
      "వెల్వెట్ పెదవి రంగు",
      "ವೆಲ್ವೆಟ್ ತುಟಿ ಬಣ್ಣ",
    ),
    localized(
      "Nourishing Nail Oil",
      "नखांसाठी पोषक तेल",
      "గోళ్ల పోషక నూనె",
      "ಉಗುರು ಪೋಷಕ ಎಣ್ಣೆ",
    ),
    localized(
      "Soft Cotton Towels",
      "मऊ सुती टॉवेल",
      "మెత్తని కాటన్ తువ్వాళ్లు",
      "ಮೃದು ಹತ್ತಿ ಟವೆಲ್",
    ),
    localized(
      "Professional Repair Mask",
      "केसांसाठी दुरुस्ती मास्क",
      "వృత్తిపరమైన హెయిర్ మాస్క్",
      "ವೃತ್ತಿಪರ ಹೇರ್ ಮಾಸ್ಕ್",
    ),
  ];

  const products: Product[] = Array.from({ length: 48 }, (_, i) => ({
    id: `p${i + 1}`,
    businessId: "maison",
    name: names[i % 6],
    description: localized(
      "A thoughtfully crafted beauty essential. Nourishing ingredients bring softness, balance and a little everyday luxury to your ritual.",
      "काळजीपूर्वक तयार केलेले सौंदर्य उत्पादन. पोषक घटक तुमच्या दैनंदिन काळजीत मऊपणा आणि संतुलन आणतात.",
      "జాగ్రత్తగా రూపొందించిన సౌందర్య ఉత్పత్తి. పోషక పదార్థాలు మీ రోజువారీ సంరక్షణకు మృదుత్వాన్ని అందిస్తాయి.",
      "ಕಾಳಜಿಯಿಂದ ರೂಪಿಸಿದ ಸೌಂದರ್ಯ ಉತ್ಪನ್ನ. ಪೋಷಕಾಂಶಗಳು ನಿಮ್ಮ ದೈನಂದಿನ ಆರೈಕೆಗೆ ಮೃದುತ್ವ ಮತ್ತು ಸಮತೋಲನ ನೀಡುತ್ತವೆ.",
    ),
    category: i % 6,
    brand: ["Maison Rosé", "Aurelia Botanics", "Luxe Atelier"][i % 3],
    price: [1250, 2450, 1850, 790, 990, 2200][i % 6] + Math.floor(i / 6) * 100,
    sku: `MR-${String(i + 1).padStart(4, "0")}`,
    image: photos[i % 6],
    variant: [
      [
        "250 ml",
        "500 ml",
        "100 ml",
        "300 ml",
        "750 ml",
        "1000 ml",
        "200 ml",
        "150 ml",
      ],
      ["30 ml", "50 ml", "15 ml", "100 ml", "60 ml", "20 ml", "75 ml", "10 ml"],
      [
        "3.5 g · 01",
        "3.5 g · 02",
        "3.5 g · 03",
        "3.5 g · 04",
        "3.5 g · 05",
        "3.5 g · 06",
        "3.5 g · 07",
        "3.5 g · 08",
      ],
      ["5 ml", "10 ml", "15 ml", "20 ml", "25 ml", "30 ml", "50 ml", "100 ml"],
      [
        "3 × 30 cm",
        "6 × 30 cm",
        "2 × 60 cm",
        "4 × 60 cm",
        "3 × 90 cm",
        "6 × 90 cm",
        "2 × 120 cm",
        "4 × 120 cm",
      ],
      [
        "200 ml",
        "500 ml",
        "100 ml",
        "300 ml",
        "750 ml",
        "1000 ml",
        "250 ml",
        "150 ml",
      ],
    ][i % 6][Math.floor(i / 6)],
    featured: i < 4,
    visible: true,
    archived: false,
    salons: salons.map((s) => s.id),
  }));
  const inventory: State["inventory"] = {};
  products.forEach((p, i) =>
    salons.forEach((s, j) => {
      inventory[key(p.id, s.id)] = {
        quantity: (i * 7 + j * 3 + 12) % 37,
        threshold: 5,
      };
    }),
  );
  const employees: Employee[] = salons.flatMap((s, i) =>
    Array.from({ length: 6 }, (_, j) => ({
      id: `e${i * 6 + j}`,
      name:
        j === 0
          ? s.manager
          : ["Aarohi", "Neha", "Sneha", "Pooja", "Divya"][j - 1] +
            " " +
            ["Patil", "Rao", "Shah", "Reddy", "Shetty"][i % 5],
      phone: `98765${String(i * 6 + j).padStart(5, "0")}`,
      role: j === 0 ? "manager" : "employee",
      salonId: s.id,
      active: true,
    })),
  );
  const published: Homepage = {
    title: localized(
      "A little ritual.\nA beautiful you.",
      "थोडीशी काळजी.\nसुंदर तुम्ही.",
      "ఒక చిన్న అలవాటు.\nఅందమైన మీరు.",
      "ಒಂದು ಸಣ್ಣ ಅಭ್ಯಾಸ.\nಸುಂದರವಾದ ನೀವು.",
    ),
    subtitle: localized(
      "Thoughtfully chosen. Beautifully made. Discover salon-loved essentials for your everyday moments of self-care.",
      "काळजीपूर्वक निवडलेली सौंदर्य उत्पादने. तुमच्या दैनंदिन काळजीसाठी सलूनची आवडती उत्पादने शोधा.",
      "జాగ్రత్తగా ఎంచుకున్న సౌందర్య ఉత్పత్తులు. మీ రోజువారీ సంరక్షణకు సెలూన్ ఇష్టమైన ఉత్పత్తులను కనుగొనండి.",
      "ಕಾಳಜಿಯಿಂದ ಆಯ್ದ ಸೌಂದರ್ಯ ಉತ್ಪನ್ನಗಳು. ನಿಮ್ಮ ದೈನಂದಿನ ಆರೈಕೆಗೆ ಸಲೂನ್ ಮೆಚ್ಚಿನ ಉತ್ಪನ್ನಗಳನ್ನು ಅನ್ವೇಷಿಸಿ.",
    ),
    image: "/beauty-hero.png",
    featured: ["p2", "p1", "p3", "p4"],
    sections: { featured: true, categories: true, locations: true },
    heading: localized(
      "Your new everyday favourites",
      "तुमची नवी रोजची आवड",
      "మీ కొత్త రోజువారీ ఇష్టాలు",
      "ನಿಮ್ಮ ಹೊಸ ದೈನಂದಿನ ಮೆಚ್ಚಿನವುಗಳು",
    ),
  };
  return {
    version: 1,
    business: "Maison Rosé",
    accent: "#886148",
    products,
    salons,
    employees,
    inventory,
    cart: [],
    history: [],
    settings: {
      browsing: true,
      shopping: true,
      reservations: true,
      employeeStock: true,
    },
    published,
    draft: structuredClone(published),
    previous: null,
    orders: [
      {
        id: "MR-1042",
        name: "Aisha Mehta",
        phone: "9876543210",
        address: "",
        salonId: "s1",
        items: [{ productId: "p2", quantity: 1 }],
        total: 2450,
        fulfilment: "pickup",
        status: "pending",
        date: "2026-10-30T10:00:00.000Z",
      },
    ],
    reservations: [
      {
        id: "RS-2041",
        name: "Riya Shah",
        phone: "9876543211",
        salonId: "s2",
        productId: "p1",
        quantity: 1,
        status: "pending",
        date: "2026-10-30T11:00:00.000Z",
      },
    ],
  };
}
