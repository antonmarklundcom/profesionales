/**
 * Idempotent seed (plan §5.1). Safe to re-run: every insert upserts on its
 * unique key, so running it against a live database never duplicates rows and
 * never clobbers admin-edited prices with defaults.
 *
 * Run with:  npm run db:push && npm run db:seed
 * tsx does NOT auto-load .env — export DATABASE_URL first (see README).
 */
import { eq } from "drizzle-orm";
import { db, pool } from "../src/db";
import {
  categories,
  creditPacks,
  professionalCategories,
  professionalZones,
  professionals,
  settings,
  spokeTokens,
  users,
  zones,
  type FormQuestion,
} from "../src/db/schema";
import { hashPassword } from "../src/lib/auth/password";
import { hashToken, normalizeParaguayanPhone } from "../src/lib/ids";

const URGENCY: FormQuestion = {
  key: "urgencia",
  label_es: "¿Para cuándo lo necesitás?",
  type: "radio",
  required: true,
  options: [
    { value: "hoy", label_es: "Hoy / es urgente" },
    { value: "esta_semana", label_es: "Esta semana" },
    { value: "sin_apuro", label_es: "Sin apuro, estoy cotizando" },
  ],
};

const PROPERTY: FormQuestion = {
  key: "tipo_propiedad",
  label_es: "¿Dónde es el trabajo?",
  type: "select",
  required: true,
  options: [
    { value: "casa", label_es: "Casa" },
    { value: "departamento", label_es: "Departamento" },
    { value: "local", label_es: "Local u oficina" },
    { value: "obra", label_es: "Obra en construcción" },
  ],
};

/** The 5 launch categories (plan §1.2). Prices start at 0 — the free phase. */
const LAUNCH_CATEGORIES = [
  {
    slug: "plomero",
    nameEs: "Plomero",
    icon: "droplet",
    sort: 1,
    formQuestions: [
      URGENCY,
      PROPERTY,
      {
        key: "problema",
        label_es: "¿Qué necesitás?",
        type: "select",
        required: true,
        options: [
          { value: "destapacion", label_es: "Destapación de cañería" },
          { value: "perdida", label_es: "Pérdida de agua" },
          { value: "instalacion", label_es: "Instalación (grifería, sanitarios)" },
          { value: "otro", label_es: "Otro" },
        ],
      } satisfies FormQuestion,
    ],
  },
  {
    slug: "electricista",
    nameEs: "Electricista",
    icon: "bolt",
    sort: 2,
    formQuestions: [
      URGENCY,
      PROPERTY,
      {
        key: "trabajo",
        label_es: "¿Qué trabajo es?",
        type: "select",
        required: true,
        options: [
          { value: "tablero", label_es: "Tablero eléctrico" },
          { value: "instalacion", label_es: "Instalación nueva" },
          { value: "reparacion", label_es: "Reparación / cortocircuito" },
          { value: "otro", label_es: "Otro" },
        ],
      } satisfies FormQuestion,
    ],
  },
  {
    slug: "aire-acondicionado",
    nameEs: "Aire acondicionado",
    icon: "snowflake",
    sort: 3,
    formQuestions: [
      URGENCY,
      PROPERTY,
      {
        key: "servicio",
        label_es: "¿Qué servicio necesitás?",
        type: "select",
        required: true,
        options: [
          { value: "instalacion", label_es: "Instalación de split" },
          { value: "carga", label_es: "Carga de gas" },
          { value: "limpieza", label_es: "Limpieza / mantenimiento" },
          { value: "reparacion", label_es: "Reparación" },
        ],
      } satisfies FormQuestion,
      {
        key: "equipos",
        label_es: "¿Cuántos equipos?",
        type: "number",
        required: false,
      } satisfies FormQuestion,
    ],
  },
  {
    slug: "cerrajero",
    nameEs: "Cerrajero",
    icon: "key",
    sort: 4,
    formQuestions: [
      URGENCY,
      {
        key: "situacion",
        label_es: "¿Cuál es la situación?",
        type: "select",
        required: true,
        options: [
          { value: "quede_afuera", label_es: "Quedé afuera / perdí la llave" },
          { value: "cambio_cerradura", label_es: "Cambio de cerradura" },
          { value: "auto", label_es: "Llave de auto" },
          { value: "otro", label_es: "Otro" },
        ],
      } satisfies FormQuestion,
    ],
  },
  {
    slug: "limpieza",
    nameEs: "Limpieza",
    icon: "sparkles",
    sort: 5,
    formQuestions: [
      URGENCY,
      PROPERTY,
      {
        key: "tipo_limpieza",
        label_es: "¿Qué tipo de limpieza?",
        type: "select",
        required: true,
        options: [
          { value: "profunda", label_es: "Limpieza profunda" },
          { value: "final_obra", label_es: "Limpieza final de obra" },
          { value: "periodica", label_es: "Limpieza periódica" },
          { value: "tapizados", label_es: "Alfombras y tapizados" },
        ],
      } satisfies FormQuestion,
      {
        key: "metros",
        label_es: "Metros cuadrados aproximados",
        type: "number",
        required: false,
      } satisfies FormQuestion,
    ],
  },
] as const;

/** Asunción + Gran Asunción (plan §2). "Otra zona" catches everything else. */
const ZONES = [
  ["asuncion", "Asunción", "Capital"],
  ["lambare", "Lambaré", "Central"],
  ["fernando-de-la-mora", "Fernando de la Mora", "Central"],
  ["san-lorenzo", "San Lorenzo", "Central"],
  ["luque", "Luque", "Central"],
  ["capiata", "Capiatá", "Central"],
  ["limpio", "Limpio", "Central"],
  ["nemby", "Ñemby", "Central"],
  ["villa-elisa", "Villa Elisa", "Central"],
  ["san-antonio", "San Antonio", "Central"],
  ["mariano-roque-alonso", "Mariano Roque Alonso", "Central"],
  ["aregua", "Areguá", "Central"],
  ["itaugua", "Itauguá", "Central"],
  ["otra-zona", "Otra zona", "Otro"],
] as const;

/** Packs from plan §11: Gs 100k/250k/500k with 0/10/20% bonus credits. */
const CREDIT_PACKS = [
  { name: "Pack Inicial", priceGs: 100_000, creditsGs: 100_000, sort: 1 },
  { name: "Pack Activo", priceGs: 250_000, creditsGs: 275_000, sort: 2 },
  { name: "Pack Pro", priceGs: 500_000, creditsGs: 600_000, sort: 3 },
] as const;

const DEFAULT_SETTINGS = [
  { key: "assignment_expiry_hours", value: "24" },
  { key: "max_photos_per_lead", value: "3" },
] as const;

async function seedCategories() {
  for (const category of LAUNCH_CATEGORIES) {
    await db
      .insert(categories)
      .values({
        slug: category.slug,
        nameEs: category.nameEs,
        icon: category.icon,
        sort: category.sort,
        leadPriceGs: 0,
        maxProsPerLead: 3,
        formQuestions: category.formQuestions as unknown as FormQuestion[],
        active: true,
      })
      // Price and max-pros are admin-editable — a re-run must not reset them.
      .onDuplicateKeyUpdate({
        set: {
          nameEs: category.nameEs,
          icon: category.icon,
          sort: category.sort,
          formQuestions: category.formQuestions as unknown as FormQuestion[],
        },
      });
  }
  console.log(`✓ ${LAUNCH_CATEGORIES.length} categorías`);
}

async function seedZones() {
  let sort = 0;
  for (const [slug, name, department] of ZONES) {
    sort += 1;
    await db
      .insert(zones)
      .values({ slug, name, department, sort, active: true })
      .onDuplicateKeyUpdate({ set: { name, department, sort } });
  }
  console.log(`✓ ${ZONES.length} zonas`);
}

async function seedCreditPacks() {
  for (const pack of CREDIT_PACKS) {
    const existing = await db.select({ id: creditPacks.id }).from(creditPacks).where(eq(creditPacks.name, pack.name));
    if (existing.length > 0) {
      await db.update(creditPacks).set(pack).where(eq(creditPacks.id, existing[0].id));
    } else {
      await db.insert(creditPacks).values(pack);
    }
  }
  console.log(`✓ ${CREDIT_PACKS.length} packs de créditos`);
}

async function seedSettings() {
  for (const setting of DEFAULT_SETTINGS) {
    await db.insert(settings).values(setting).onDuplicateKeyUpdate({ set: { value: setting.value } });
  }
  console.log(`✓ ${DEFAULT_SETTINGS.length} settings`);
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@profesionales.com.py").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "cambiar-esta-clave";

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    console.log(`✓ admin ya existe (${email})`);
    return;
  }

  await db.insert(users).values({
    email,
    passwordHash: await hashPassword(password),
    role: "admin",
    status: "active",
  });
  console.log(`✓ admin creado (${email})`);
  if (!process.env.ADMIN_PASSWORD) {
    console.warn("  ⚠ ADMIN_PASSWORD no estaba definido — se usó la clave por defecto. Cambiala ya.");
  }
}

/** Dev-only demo pro. Never seeded in production (plan §6.3 prod seed excludes it). */
async function seedDemoProfessional() {
  if (process.env.NODE_ENV === "production" || process.env.SEED_DEMO === "false") {
    console.log("· demo pro omitido (producción)");
    return;
  }

  const email = "demo.pro@profesionales.com.py";
  let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    await db.insert(users).values({
      email,
      passwordHash: await hashPassword(process.env.DEMO_PRO_PASSWORD ?? "demo-pro-1234"),
      role: "professional",
      status: "active",
    });
    [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  }

  let [pro] = await db.select().from(professionals).where(eq(professionals.userId, user.id)).limit(1);
  if (!pro) {
    await db.insert(professionals).values({
      userId: user.id,
      businessName: "Servicios Demo SRL",
      slug: "servicios-demo",
      cedulaRuc: "1234567-8",
      whatsapp: normalizeParaguayanPhone("0981123456") ?? "+595981123456",
      bio: "Profesional de demostración para desarrollo local.",
      yearsExperience: 5,
      verifiedAt: new Date(),
    });
    [pro] = await db.select().from(professionals).where(eq(professionals.userId, user.id)).limit(1);
  }

  const [plomero] = await db.select().from(categories).where(eq(categories.slug, "plomero")).limit(1);
  const [asuncion] = await db.select().from(zones).where(eq(zones.slug, "asuncion")).limit(1);
  if (plomero) {
    await db
      .insert(professionalCategories)
      .values({ professionalId: pro.id, categoryId: plomero.id })
      .onDuplicateKeyUpdate({ set: { categoryId: plomero.id } });
  }
  if (asuncion) {
    await db
      .insert(professionalZones)
      .values({ professionalId: pro.id, zoneId: asuncion.id })
      .onDuplicateKeyUpdate({ set: { zoneId: asuncion.id } });
  }
  console.log(`✓ pro demo (${email})`);
}

/** Optional: a spoke token for local testing of the hub-and-spoke API (plan §1.7). */
async function seedSpokeToken() {
  const token = process.env.SPOKE_SEED_TOKEN;
  if (!token) {
    console.log("· SPOKE_SEED_TOKEN no definido — se omite el token de spoke");
    return;
  }
  await db
    .insert(spokeTokens)
    .values({ tokenHash: hashToken(token), domain: process.env.SPOKE_SEED_DOMAIN ?? "localhost", active: true })
    .onDuplicateKeyUpdate({ set: { active: true } });
  console.log("✓ token de spoke");
}

async function main() {
  console.log("Seeding profesionales…");
  await seedCategories();
  await seedZones();
  await seedCreditPacks();
  await seedSettings();
  await seedAdmin();
  await seedDemoProfessional();
  await seedSpokeToken();
  console.log("Listo.");
}

main()
  .catch((error) => {
    console.error("Seed falló:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
