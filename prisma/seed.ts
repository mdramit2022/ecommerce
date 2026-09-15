import { PrismaClient, Prisma } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// ─────────────────────────────── Demo accounts ───────────────────────────────
// Documented in docs/RUNBOOK.md. Change these before any non-local deployment.
export const DEMO_ADMIN = { email: "admin@example.com", password: "Admin123!", name: "Admin" };
export const DEMO_CUSTOMER = {
  email: "customer@example.com",
  password: "Customer123!",
  name: "Demo Customer",
};

/** Reviewer accounts that only exist to give products believable ratings. No password: cannot sign in. */
const REVIEWERS = [
  { email: "reviewer.sita@example.com", name: "Sita Sharma" },
  { email: "reviewer.ramesh@example.com", name: "Ramesh Thapa" },
  { email: "reviewer.anita@example.com", name: "Anita Gurung" },
  { email: "reviewer.bikash@example.com", name: "Bikash Shrestha" },
  { email: "reviewer.puja@example.com", name: "Puja Maharjan" },
  { email: "reviewer.suman@example.com", name: "Suman Rai" },
  { email: "reviewer.kriti@example.com", name: "Kriti Adhikari" },
  { email: "reviewer.dipesh@example.com", name: "Dipesh Karki" },
];

/** Stock photos, verified to resolve. Dummy imagery until real product shots exist. */
const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=80`;

// Menu order = creation order (the storefront orders categories by createdAt).
const categories = [
  {
    name: "Cookware",
    slug: "cookware",
    description: "Pressure cookers, kadhai, frypans and tawa for every stove.",
    image: img("1556912167-f556f1f39fdf"),
  },
  {
    name: "Kitchenware",
    slug: "kitchenware",
    description: "Knives, ladles, choppers, graters and the tools that make cooking easy.",
    image: img("1556228720-195a672e8a03"),
  },
  {
    name: "Plastic Products",
    slug: "plastic-products",
    description: "Buckets, mugs, tubs and food containers in food-grade plastic.",
    image: img("1523362628745-0c100150b504"),
  },
  {
    name: "Stainless Steel",
    slug: "stainless-steel",
    description: "Heavy-gauge thali sets, bowls, tiffins and glasses that last a lifetime.",
    image: img("1584622650111-993a426fbf0a"),
  },
  {
    name: "Glass & Ceramic",
    slug: "glass-ceramic",
    description: "Cup sets, dinner plates, bowls and jars for the table.",
    image: img("1514228742587-6b1558fcca3d"),
  },
  {
    name: "Gas & Stove",
    slug: "gas-stove",
    description: "Two-burner stoves, regulators, lighters and gas accessories.",
    image: img("1556228453-efd6c1ff04f6"),
  },
  {
    name: "Appliances",
    slug: "appliances",
    description: "Kettles, induction cooktops, mixers and rice cookers.",
    image: img("1585659722983-3a675dabf23d"),
  },
  {
    name: "Racks & Storage",
    slug: "racks-storage",
    description: "Dish racks, storage racks and spice organisers that tidy the kitchen.",
    image: img("1600210492486-724fe5c67fb0"),
  },
  {
    name: "Household",
    slug: "household",
    description: "Mops, dustbins, laundry baskets and everyday household essentials.",
    image: img("1583847268964-b28dc8f51f92"),
  },
];

type SeedProduct = {
  title: string;
  slug: string;
  description: string;
  /** Rupees, as a string for Prisma.Decimal. */
  price: string;
  compareAtPrice?: string;
  stock: number;
  images: string[];
  categorySlug: string;
  /** Shown in "Best Sellers". */
  isFeatured?: boolean;
  /** How long ago the product was added; recent ones surface in "New Arrivals". */
  daysAgo: number;
};

const products: SeedProduct[] = [
  // ── Cookware ──
  {
    title: "Prestige Pressure Cooker 5 Litre",
    slug: "prestige-pressure-cooker-5-litre",
    description:
      "Aluminium outer-lid pressure cooker with a gasket release system and controlled weight valve. Five litres feeds a family of four to six; induction and gas compatible.",
    price: "3250",
    compareAtPrice: "3950",
    stock: 40,
    images: [img("1585515320310-259814833e62")],
    categorySlug: "cookware",
    isFeatured: true,
    daysAgo: 180,
  },
  {
    title: "Non-Stick Frypan 26 cm",
    slug: "non-stick-frypan-26-cm",
    description:
      "Three-layer non-stick coating on a 3 mm aluminium base with a cool-touch bakelite handle. Metal-spoon safe and even-heating on gas and induction.",
    price: "1450",
    compareAtPrice: "1850",
    stock: 65,
    images: [img("1604719312566-8912e9227c6a")],
    categorySlug: "cookware",
    isFeatured: true,
    daysAgo: 150,
  },
  {
    title: "Hard Anodised Kadhai 3 Litre",
    slug: "hard-anodised-kadhai-3-litre",
    description:
      "Deep hard-anodised kadhai with a glass lid, ideal for tarkari, deep frying and curries. Scratch resistant, non-reactive and twice as hard as stainless steel.",
    price: "2150",
    compareAtPrice: "2600",
    stock: 30,
    images: [img("1590794056226-79ef3a8147e1")],
    categorySlug: "cookware",
    daysAgo: 120,
  },
  {
    title: "Cast Iron Tawa 28 cm",
    slug: "cast-iron-tawa-28-cm",
    description:
      "Pre-seasoned cast iron tawa for roti, dosa and sel roti. Holds heat evenly and builds a natural non-stick surface with use.",
    price: "1650",
    stock: 22,
    images: [img("1544233726-9f1d2b27be8b")],
    categorySlug: "cookware",
    daysAgo: 95,
  },

  // ── Kitchenware ──
  {
    title: "Kitchen Knife Set (5 pcs)",
    slug: "kitchen-knife-set-5-pcs",
    description:
      "Chef's knife, bread knife, utility knife, paring knife and kitchen scissors in a wooden block. High-carbon stainless blades with ergonomic handles.",
    price: "1800",
    stock: 45,
    images: [img("1593618998160-e34014e67546")],
    categorySlug: "kitchenware",
    daysAgo: 2,
  },
  {
    title: "Stainless Steel Ladle Set (6 pcs)",
    slug: "stainless-steel-ladle-set-6-pcs",
    description:
      "Serving spoon, slotted spoon, ladle, skimmer, turner and pasta server with hanging hooks. Mirror-finish stainless steel, dishwasher safe.",
    price: "950",
    compareAtPrice: "1200",
    stock: 80,
    images: [img("1510626176961-4b57d4fbad03")],
    categorySlug: "kitchenware",
    daysAgo: 200,
  },
  {
    title: "Vegetable Chopper with Container",
    slug: "vegetable-chopper-with-container",
    description:
      "Pull-cord chopper with three stainless blades and a 900 ml bowl. Chops onion, garlic, chilli and nuts in seconds; lid and blades come apart for washing.",
    price: "650",
    compareAtPrice: "850",
    stock: 120,
    images: [img("1567767292278-a4f21aa2d36e")],
    categorySlug: "kitchenware",
    daysAgo: 60,
  },
  {
    title: "Four-Sided Box Grater",
    slug: "four-sided-box-grater",
    description:
      "Coarse, fine, slicing and zesting faces on one sturdy stainless steel grater with a non-slip base and a comfortable top handle.",
    price: "480",
    stock: 90,
    images: [img("1578500494198-246f612d3b3d")],
    categorySlug: "kitchenware",
    daysAgo: 140,
  },

  // ── Plastic Products ──
  {
    title: "Plastic Bucket 20 Litre",
    slug: "plastic-bucket-20-litre",
    description:
      "Unbreakable virgin-plastic bucket with a steel handle and reinforced rim. Twenty litres, stackable, in bright colours that do not fade.",
    price: "850",
    compareAtPrice: "1100",
    stock: 150,
    images: [img("1583088580009-2d947c3e90a6")],
    categorySlug: "plastic-products",
    isFeatured: true,
    daysAgo: 220,
  },
  {
    title: "Plastic Mug 1.5 Litre",
    slug: "plastic-mug-1-5-litre",
    description:
      "Bathroom mug in tough food-grade plastic with a wide comfortable handle. Matches the 20 litre bucket colours.",
    price: "180",
    stock: 300,
    images: [img("1600489000022-c2086d79f9d4")],
    categorySlug: "plastic-products",
    daysAgo: 220,
  },
  {
    title: "Airtight Food Container Set (12 pcs)",
    slug: "airtight-food-container-set-12-pcs",
    description:
      "Six containers with six locking lids, from 300 ml to 2.4 litres, BPA-free and freezer safe. Keeps dal, rice and snacks fresh for weeks.",
    price: "1650",
    compareAtPrice: "2100",
    stock: 55,
    images: [img("1594226801341-41427b4e5c22")],
    categorySlug: "plastic-products",
    daysAgo: 45,
  },
  {
    title: "Laundry Tub 40 Litre",
    slug: "laundry-tub-40-litre",
    description:
      "Wide, shallow tub for hand-washing clothes or soaking dishes. Thick walls, textured base and moulded grips for carrying when full.",
    price: "1150",
    stock: 70,
    images: [img("1600585154340-be6161a56a0c")],
    categorySlug: "plastic-products",
    daysAgo: 160,
  },

  // ── Stainless Steel ──
  {
    title: "Stainless Steel Thali Set",
    slug: "stainless-steel-thali-set",
    description:
      "Full-size thali with four katori bowls and a tumbler in 22-gauge stainless steel. Rolled edges, mirror polish, and it never rusts.",
    price: "1200",
    compareAtPrice: "1500",
    stock: 60,
    images: [img("1584568694244-14fbdf83bd30")],
    categorySlug: "stainless-steel",
    isFeatured: true,
    daysAgo: 190,
  },
  {
    title: "Steel Tiffin Box 3 Tier",
    slug: "steel-tiffin-box-3-tier",
    description:
      "Three leak-resistant stainless tiers with a locking clip carrier. Keeps dal, bhat and tarkari separate on the way to work or school.",
    price: "980",
    compareAtPrice: "1250",
    stock: 85,
    images: [img("1530305408560-82d13781b33a")],
    categorySlug: "stainless-steel",
    daysAgo: 110,
  },
  {
    title: "Steel Water Glass Set (6 pcs)",
    slug: "steel-water-glass-set-6-pcs",
    description:
      "Six 300 ml stainless steel tumblers with a laser-etched band. Unbreakable and dishwasher safe - the everyday glass for Nepali homes.",
    price: "720",
    stock: 140,
    images: [img("1558618666-fcd25c85cd64")],
    categorySlug: "stainless-steel",
    daysAgo: 130,
  },
  {
    title: "Steel Mixing Bowl Set (3 pcs)",
    slug: "steel-mixing-bowl-set-3-pcs",
    description:
      "Nesting 1, 2 and 3 litre bowls with flat bases for kneading atta, marinating and serving. Deep sides, easy-grip rims.",
    price: "1350",
    compareAtPrice: "1600",
    stock: 48,
    images: [img("1416879595882-3373a0480b5b")],
    categorySlug: "stainless-steel",
    daysAgo: 75,
  },

  // ── Glass & Ceramic ──
  {
    title: "Ceramic Cup Set (6 pcs)",
    slug: "ceramic-cup-set-6-pcs",
    description:
      "Six 200 ml stoneware cups with a soft matte glaze - the right size for chiya. Microwave and dishwasher safe.",
    price: "1350",
    compareAtPrice: "1700",
    stock: 52,
    images: [img("1526170375885-4d8ecf77b99f")],
    categorySlug: "glass-ceramic",
    isFeatured: true,
    daysAgo: 170,
  },
  {
    title: "Melamine Plate Set (6 pcs)",
    slug: "melamine-plate-set-6-pcs",
    description:
      "Six 10-inch dinner plates in chip-resistant melamine with a printed rim. Light enough for children, tough enough for daily use.",
    price: "950",
    stock: 75,
    images: [img("1495474472287-4d71bcdd2085")],
    categorySlug: "glass-ceramic",
    daysAgo: 1,
  },
  {
    title: "Glass Storage Jar Set (4 pcs)",
    slug: "glass-storage-jar-set-4-pcs",
    description:
      "Four borosilicate jars with bamboo lids and silicone seals, 500 ml to 1.5 litres. Shows what is inside and keeps moisture out.",
    price: "1450",
    compareAtPrice: "1800",
    stock: 40,
    images: [img("1574180045827-681f8a1a9622")],
    categorySlug: "glass-ceramic",
    daysAgo: 85,
  },
  {
    title: "Ceramic Serving Bowl 24 cm",
    slug: "ceramic-serving-bowl-24-cm",
    description:
      "Wide hand-glazed serving bowl for salad, biryani or fruit. Each piece varies slightly in the glaze, as hand-finished ceramic should.",
    price: "1100",
    stock: 35,
    images: [img("1544787219-7f47ccb76574")],
    categorySlug: "glass-ceramic",
    daysAgo: 55,
  },

  // ── Gas & Stove ──
  {
    title: "Two-Burner Gas Stove (Glass Top)",
    slug: "two-burner-gas-stove-glass-top",
    description:
      "Toughened glass top with two brass burners, auto ignition and stainless drip trays. ISI-marked and built for LPG cylinders.",
    price: "6800",
    compareAtPrice: "7900",
    stock: 18,
    images: [img("1556909114-f6e7ad7d3136")],
    categorySlug: "gas-stove",
    daysAgo: 100,
  },
  {
    title: "Gas Regulator with Safety Valve",
    slug: "gas-regulator-with-safety-valve",
    description:
      "Low-pressure LPG regulator with an automatic cut-off on leak or excess flow. Fits standard Nepali cylinders.",
    price: "1250",
    stock: 60,
    images: [img("1560448204-e02f11c3d0e2")],
    categorySlug: "gas-stove",
    daysAgo: 210,
  },
  {
    title: "Gas Lighter (Refillable)",
    slug: "gas-lighter-refillable",
    description:
      "Long-neck piezo lighter that keeps fingers away from the flame. Refillable and with a child-safety lock.",
    price: "220",
    stock: 200,
    images: [img("1571781926291-c477ebfd024b")],
    categorySlug: "gas-stove",
    daysAgo: 230,
  },
  {
    title: "Heavy Duty Gas Hose 1.5 m",
    slug: "heavy-duty-gas-hose-1-5-m",
    description:
      "Steel-braided LPG hose with crimped ends and clamps included. Rated for five years of daily kitchen use.",
    price: "650",
    stock: 90,
    images: [img("1586023492125-27b2c045efd7")],
    categorySlug: "gas-stove",
    daysAgo: 125,
  },

  // ── Appliances ──
  {
    title: "Electric Kettle 1.8 Litre",
    slug: "electric-kettle-1-8-litre",
    description:
      "1500 W stainless kettle with auto shut-off, boil-dry protection and a 360-degree cordless base. Boils a litre in under four minutes.",
    price: "2450",
    stock: 35,
    images: [img("1588854337115-1c67d9247e4d")],
    categorySlug: "appliances",
    daysAgo: 3,
  },
  {
    title: "Induction Cooker 2000 W",
    slug: "induction-cooker-2000-w",
    description:
      "Touch-panel induction cooktop with eight presets, a timer and a crystal glass plate. Works with all steel and cast-iron pans.",
    price: "6500",
    stock: 20,
    images: [img("1600494603989-9650cf6ddd3d")],
    categorySlug: "appliances",
    daysAgo: 4,
  },
  {
    title: "Mixer Grinder 750 W (3 Jars)",
    slug: "mixer-grinder-750-w-3-jars",
    description:
      "750 W motor with three stainless jars for chutney, dry masala and juice. Overload protection and a two-year motor warranty.",
    price: "5200",
    compareAtPrice: "6200",
    stock: 15,
    images: [img("1596040033229-a9821ebd058d")],
    categorySlug: "appliances",
    daysAgo: 70,
  },
  {
    title: "Electric Rice Cooker 1.8 Litre",
    slug: "electric-rice-cooker-1-8-litre",
    description:
      "One-touch rice cooker with a keep-warm mode, a non-stick inner pot and a steaming tray. Cooks up to ten cups of bhat.",
    price: "3300",
    compareAtPrice: "3800",
    stock: 28,
    images: [img("1598300042247-d088f8ab3a91")],
    categorySlug: "appliances",
    daysAgo: 90,
  },

  // ── Racks & Storage ──
  {
    title: "Storage Rack 4 Tier",
    slug: "storage-rack-4-tier",
    description:
      "Powder-coated steel rack with four adjustable shelves, 120 cm tall. Holds pots, containers or a small pantry without tools to assemble.",
    price: "2200",
    stock: 25,
    images: [img("1513694203232-719a280e022f")],
    categorySlug: "racks-storage",
    daysAgo: 5,
  },
  {
    title: "Dish Drying Rack with Tray",
    slug: "dish-drying-rack-with-tray",
    description:
      "Two-tier chrome dish rack with a cutlery holder, glass hooks and a removable drip tray. Rust-resistant coating.",
    price: "1850",
    compareAtPrice: "2300",
    stock: 40,
    images: [img("1522708323590-d24dbb6b0267")],
    categorySlug: "racks-storage",
    daysAgo: 115,
  },
  {
    title: "Spice Rack Set (16 Jars)",
    slug: "spice-rack-set-16-jars",
    description:
      "Rotating stand with sixteen glass jars and sifter lids. Keeps masala within reach and off the counter.",
    price: "1950",
    stock: 30,
    images: [img("1607301405390-d831c242f59b")],
    categorySlug: "racks-storage",
    daysAgo: 65,
  },
  {
    title: "Under-Sink Organiser",
    slug: "under-sink-organiser",
    description:
      "Expandable two-tier shelf that fits around pipes to double the space under the sink. Steel frame, plastic shelves.",
    price: "1350",
    compareAtPrice: "1650",
    stock: 45,
    images: [img("1615874959474-d609969a20ed")],
    categorySlug: "racks-storage",
    daysAgo: 150,
  },

  // ── Household ──
  {
    title: "Spin Mop with Bucket",
    slug: "spin-mop-with-bucket",
    description:
      "Foot-pedal spin bucket with two microfibre mop heads and a telescopic steel handle. Wrings hands-free and dries floors fast.",
    price: "2350",
    compareAtPrice: "2900",
    stock: 38,
    images: [img("1610701596007-11502861dcfa")],
    categorySlug: "household",
    daysAgo: 80,
  },
  {
    title: "Pedal Dustbin 12 Litre",
    slug: "pedal-dustbin-12-litre",
    description:
      "Soft-close pedal bin in stainless steel with a removable inner bucket. Fingerprint-resistant finish for the kitchen or bathroom.",
    price: "1650",
    stock: 50,
    images: [img("1615486511484-92e172cc4fe0")],
    categorySlug: "household",
    daysAgo: 135,
  },
  {
    title: "Laundry Basket with Lid",
    slug: "laundry-basket-with-lid",
    description:
      "Woven-look plastic hamper, 60 litres, with a hinged lid and cut-out handles. Ventilated sides keep clothes fresh.",
    price: "1250",
    compareAtPrice: "1500",
    stock: 42,
    images: [img("1616486338812-3dadae4b4ace")],
    categorySlug: "household",
    daysAgo: 105,
  },
  {
    title: "Cloth Hanger Set (12 pcs)",
    slug: "cloth-hanger-set-12-pcs",
    description:
      "Twelve non-slip velvet hangers with a 360-degree swivel hook. Slim profile fits twice as many clothes in the same wardrobe.",
    price: "580",
    stock: 160,
    images: [img("1617806118233-18e1de247200")],
    categorySlug: "household",
    daysAgo: 40,
  },
];

/**
 * Reviews from the reviewer accounts: `[productSlug, ratings...]`. One review per reviewer per
 * product (the schema's unique constraint), reviewers assigned in order.
 */
const productRatings: Array<[string, number[]]> = [
  ["prestige-pressure-cooker-5-litre", [5, 5, 5, 4, 5, 5, 4, 5]],
  ["non-stick-frypan-26-cm", [5, 4, 5, 4, 5, 5, 4]],
  ["stainless-steel-thali-set", [5, 5, 4, 5, 5, 4, 5, 5]],
  ["plastic-bucket-20-litre", [4, 5, 4, 5, 4, 5]],
  ["ceramic-cup-set-6-pcs", [5, 4, 5, 5, 4, 5]],
  ["electric-kettle-1-8-litre", [5, 4, 4, 5]],
  ["induction-cooker-2000-w", [5, 5, 4, 5, 5]],
  ["kitchen-knife-set-5-pcs", [4, 4, 5, 4]],
  ["storage-rack-4-tier", [5, 4, 5, 4, 5]],
  ["melamine-plate-set-6-pcs", [4, 5, 4, 5]],
  ["hard-anodised-kadhai-3-litre", [5, 4, 5]],
  ["steel-tiffin-box-3-tier", [5, 5, 4]],
  ["two-burner-gas-stove-glass-top", [5, 4, 5, 5]],
  ["mixer-grinder-750-w-3-jars", [4, 5, 4]],
  ["spin-mop-with-bucket", [5, 5, 4, 4]],
  ["airtight-food-container-set-12-pcs", [4, 5, 5]],
];

const REVIEW_COMMENTS = [
  "Exactly as described and very well made. Delivery to Kathmandu took a day.",
  "Good quality for the price. Would buy again.",
  "Solid, heavy and finished nicely. Happy with it.",
  "Works perfectly - my mother approves, which says everything.",
  "Better than what I found in New Road for the same money.",
  "Packaging was careful and the product is exactly the size listed.",
  "Great value. Ordered a second one for my sister.",
  "Does the job well. Cash on delivery made it easy.",
];

const demoCustomerReviews: Array<{ productSlug: string; rating: number; comment: string }> = [
  {
    productSlug: "prestige-pressure-cooker-5-litre",
    rating: 5,
    comment: "Cooks dal in ten minutes and the whistle is loud enough to hear from the next room.",
  },
  {
    productSlug: "stainless-steel-thali-set",
    rating: 5,
    comment: "Heavy gauge steel, not the thin kind. The katoris are a generous size.",
  },
  {
    productSlug: "ceramic-cup-set-6-pcs",
    rating: 4,
    comment: "Lovely matte glaze. One cup had a tiny glaze bubble, otherwise perfect for chiya.",
  },
];

const daysAgo = (days: number, hours = 0) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000 - hours * 60 * 60 * 1000);

async function main(): Promise<void> {
  // ── Users ──────────────────────────────────────────────────────────────
  const [adminHash, customerHash] = await Promise.all([
    hash(DEMO_ADMIN.password, 12),
    hash(DEMO_CUSTOMER.password, 12),
  ]);

  await prisma.user.upsert({
    where: { email: DEMO_ADMIN.email },
    update: { role: "ADMIN" },
    create: {
      email: DEMO_ADMIN.email,
      name: DEMO_ADMIN.name,
      role: "ADMIN",
      passwordHash: adminHash,
    },
  });
  const customer = await prisma.user.upsert({
    where: { email: DEMO_CUSTOMER.email },
    update: {},
    create: { email: DEMO_CUSTOMER.email, name: DEMO_CUSTOMER.name, passwordHash: customerHash },
  });

  const reviewerIds: string[] = [];
  for (const reviewer of REVIEWERS) {
    const row = await prisma.user.upsert({
      where: { email: reviewer.email },
      update: { name: reviewer.name },
      create: { email: reviewer.email, name: reviewer.name },
      select: { id: true },
    });
    reviewerIds.push(row.id);
  }

  // ── Categories ─────────────────────────────────────────────────────────
  const categoryIdBySlug = new Map<string, string>();
  for (const c of categories) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, image: c.image },
      create: c,
      select: { id: true, slug: true },
    });
    categoryIdBySlug.set(row.slug, row.id);
  }

  // ── Products ───────────────────────────────────────────────────────────
  const productBySlug = new Map<
    string,
    { id: string; title: string; price: Prisma.Decimal; image: string | null }
  >();
  for (const p of products) {
    const categoryId = categoryIdBySlug.get(p.categorySlug);
    if (!categoryId) throw new Error(`Unknown category slug: ${p.categorySlug}`);

    const row = await prisma.product.upsert({
      where: { slug: p.slug },
      // Copy text, imagery and pricing changes forward; never touch stock (orders move it).
      update: {
        title: p.title,
        description: p.description,
        images: p.images,
        price: new Prisma.Decimal(p.price),
        compareAtPrice: p.compareAtPrice ? new Prisma.Decimal(p.compareAtPrice) : null,
        isFeatured: p.isFeatured ?? false,
        isActive: true,
        categoryId,
      },
      create: {
        title: p.title,
        slug: p.slug,
        description: p.description,
        price: new Prisma.Decimal(p.price),
        compareAtPrice: p.compareAtPrice ? new Prisma.Decimal(p.compareAtPrice) : null,
        stock: p.stock,
        images: p.images,
        isFeatured: p.isFeatured ?? false,
        categoryId,
        createdAt: daysAgo(p.daysAgo),
      },
      select: { id: true, title: true, price: true, images: true },
    });
    productBySlug.set(p.slug, {
      id: row.id,
      title: row.title,
      price: row.price,
      image: row.images[0] ?? null,
    });
  }

  // ── Retire the previous demo catalog ───────────────────────────────────
  // Products that are not in this seed: delete when nothing references them, otherwise soft-delete
  // (CLAUDE.md 5.6 - order history must survive). Categories left empty are removed.
  const keepSlugs = new Set(products.map((p) => p.slug));
  const strangers = await prisma.product.findMany({
    where: { slug: { notIn: [...keepSlugs] } },
    select: { id: true, slug: true, _count: { select: { orderItems: true } } },
  });
  let retired = 0;
  let removed = 0;
  for (const stranger of strangers) {
    if (stranger._count.orderItems > 0) {
      await prisma.product.update({ where: { id: stranger.id }, data: { isActive: false } });
      retired += 1;
    } else {
      await prisma.product.delete({ where: { id: stranger.id } });
      removed += 1;
    }
  }
  const emptyCategories = await prisma.category.deleteMany({
    where: { slug: { notIn: categories.map((c) => c.slug) }, products: { none: {} } },
  });

  // ── Reviews ────────────────────────────────────────────────────────────
  let reviewCount = 0;
  for (const [slug, ratings] of productRatings) {
    const product = productBySlug.get(slug);
    if (!product) throw new Error(`Rating for unknown product: ${slug}`);
    for (const [index, rating] of ratings.entries()) {
      const userId = reviewerIds[index % reviewerIds.length];
      if (!userId) continue;
      const comment = REVIEW_COMMENTS[(index + slug.length) % REVIEW_COMMENTS.length] ?? null;
      await prisma.review.upsert({
        where: { userId_productId: { userId, productId: product.id } },
        update: { rating, comment },
        create: {
          userId,
          productId: product.id,
          rating,
          comment,
          createdAt: daysAgo(3 + ((index * 7 + slug.length) % 60)),
        },
      });
      reviewCount += 1;
    }
  }
  for (const r of demoCustomerReviews) {
    const product = productBySlug.get(r.productSlug);
    if (!product) continue;
    await prisma.review.upsert({
      where: { userId_productId: { userId: customer.id, productId: product.id } },
      update: { rating: r.rating, comment: r.comment },
      create: { userId: customer.id, productId: product.id, rating: r.rating, comment: r.comment },
    });
    reviewCount += 1;
  }

  // ── Address (demo customer) ────────────────────────────────────────────
  const kathmandu = {
    fullName: DEMO_CUSTOMER.name,
    line1: "12 Durbar Marg",
    line2: null,
    city: "Kathmandu",
    state: "Bagmati",
    postalCode: "44600",
    country: "NP",
    phone: "+977 9800000000",
  };
  const existingAddress = await prisma.address.findFirst({
    where: { userId: customer.id },
    orderBy: { createdAt: "asc" },
  });
  if (!existingAddress) {
    await prisma.address.create({ data: { userId: customer.id, ...kathmandu, isDefault: true } });
  } else if (existingAddress.line1 === "1 Market Street") {
    // The earlier demo address was in San Francisco; move it home.
    await prisma.address.update({ where: { id: existingAddress.id }, data: kathmandu });
  }

  // ── Sample orders (demo customer) ──────────────────────────────────────
  // Existing rows are left untouched (`update: {}`) so order history stays exactly as it was.
  const cooker = productBySlug.get("prestige-pressure-cooker-5-litre");
  const frypan = productBySlug.get("non-stick-frypan-26-cm");
  const thali = productBySlug.get("stainless-steel-thali-set");
  const kettle = productBySlug.get("electric-kettle-1-8-litre");
  if (!cooker || !frypan || !thali || !kettle) {
    throw new Error("Seed products missing for sample orders");
  }

  const shippingSnapshot = {
    shippingName: DEMO_CUSTOMER.name,
    shippingLine1: kathmandu.line1,
    shippingCity: kathmandu.city,
    shippingState: kathmandu.state,
    shippingPostalCode: kathmandu.postalCode,
    shippingCountry: kathmandu.country,
    shippingPhone: kathmandu.phone,
  };
  const zero = new Prisma.Decimal(0);
  const line = (
    p: { id: string; title: string; price: Prisma.Decimal; image: string | null },
    quantity: number,
  ) => ({
    productId: p.id,
    title: p.title,
    image: p.image,
    unitPrice: p.price,
    quantity,
  });

  const paidSubtotal = cooker.price.mul(1).add(frypan.price.mul(2));
  await prisma.order.upsert({
    where: { orderNumber: "ORD-DEMO-0001" },
    update: {},
    create: {
      orderNumber: "ORD-DEMO-0001",
      userId: customer.id,
      email: DEMO_CUSTOMER.email,
      status: "DELIVERED",
      paymentStatus: "PAID",
      paymentMethod: "STRIPE",
      subtotal: paidSubtotal,
      shippingCost: zero,
      tax: zero,
      total: paidSubtotal,
      currency: "npr",
      stripeSessionId: "cs_test_demo_0001",
      stripePaymentIntentId: "pi_test_demo_0001",
      ...shippingSnapshot,
      createdAt: daysAgo(6),
      items: { create: [line(cooker, 1), line(frypan, 2)] },
    },
  });

  await prisma.order.upsert({
    where: { orderNumber: "ORD-DEMO-0002" },
    update: {},
    create: {
      orderNumber: "ORD-DEMO-0002",
      userId: customer.id,
      email: DEMO_CUSTOMER.email,
      status: "PENDING",
      paymentStatus: "UNPAID",
      paymentMethod: "STRIPE",
      subtotal: kettle.price,
      shippingCost: zero,
      tax: zero,
      total: kettle.price,
      currency: "npr",
      stripeSessionId: "cs_test_demo_0002",
      ...shippingSnapshot,
      createdAt: daysAgo(0, 2),
      items: { create: [line(kettle, 1)] },
    },
  });

  // Cash on delivery, already shipped but not yet collected - shows the manual payment flow
  // in /admin/orders (status moves on its own, payment is recorded separately).
  await prisma.order.upsert({
    where: { orderNumber: "ORD-DEMO-0003" },
    update: {},
    create: {
      orderNumber: "ORD-DEMO-0003",
      userId: customer.id,
      email: DEMO_CUSTOMER.email,
      status: "SHIPPED",
      paymentStatus: "UNPAID",
      paymentMethod: "CASH_ON_DELIVERY",
      subtotal: thali.price,
      shippingCost: zero,
      tax: zero,
      total: thali.price,
      currency: "npr",
      ...shippingSnapshot,
      createdAt: daysAgo(1),
      items: { create: [line(thali, 1)] },
    },
  });

  // eSewa transfer awaiting verification - the admin confirms or rejects the transaction code.
  await prisma.order.upsert({
    where: { orderNumber: "ORD-DEMO-0004" },
    update: {},
    create: {
      orderNumber: "ORD-DEMO-0004",
      userId: customer.id,
      email: DEMO_CUSTOMER.email,
      status: "PENDING",
      paymentStatus: "UNPAID",
      paymentMethod: "ESEWA",
      paymentReference: "0AB1CD2",
      subtotal: frypan.price,
      shippingCost: zero,
      tax: zero,
      total: frypan.price,
      currency: "npr",
      ...shippingSnapshot,
      createdAt: daysAgo(0, 0.75),
      items: { create: [line(frypan, 1)] },
    },
  });

  console.log(
    `Seeded ${categories.length} categories, ${products.length} products, ${reviewCount} reviews, ${REVIEWERS.length} reviewers, 1 address, 4 orders.`,
  );
  if (retired || removed || emptyCategories.count) {
    console.log(
      `Previous catalog: ${removed} products deleted, ${retired} kept inactive (referenced by orders), ${emptyCategories.count} empty categories removed.`,
    );
  }
  console.log(`Admin login:    ${DEMO_ADMIN.email} / ${DEMO_ADMIN.password}`);
  console.log(`Customer login: ${DEMO_CUSTOMER.email} / ${DEMO_CUSTOMER.password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
