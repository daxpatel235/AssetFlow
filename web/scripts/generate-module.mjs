#!/usr/bin/env node
/**
 * Module generator (Postgres/Prisma/TypeScript). Scaffolds a COMPLETE, typed
 * CRUD feature: Prisma model + Zod schema + API routes + page + sidebar entry.
 *
 *   node scripts/generate-module.mjs <Name> [field:type[:opts]] ...
 *
 * Examples:
 *   node scripts/generate-module.mjs Task title status:enum:todo,doing,done due:date
 *   node scripts/generate-module.mjs Customer name email phone active:boolean
 *
 * Field types: string (default) | text | number | currency | boolean | date |
 *              enum:a,b,c | ref
 * The first string field is the label/search field. Enum fields become filters.
 *
 * After running:  npm run db:push   (applies schema + regenerates client),
 * then restart `npm run dev`. Re-run with --force to overwrite files.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const force = args.includes('--force');
const positional = args.filter((a) => !a.startsWith('--'));
const rawName = positional[0];

if (!rawName) {
  console.error('Usage: node scripts/generate-module.mjs <Name> [field:type[:opts]] ...');
  process.exit(1);
}

// ---- naming ----
const Model = rawName.charAt(0).toUpperCase() + rawName.slice(1);
const modelCamel = Model.charAt(0).toLowerCase() + Model.slice(1); // prisma delegate
const plural = pluralize(modelCamel);
const Plural = pluralize(Model);

// ---- fields ----
const fields = positional.slice(1).map(parseField);
if (!fields.length) fields.push(parseField('name'), parseField('status:enum:active,archived'));

const stringFields = fields.filter((f) => f.type === 'string' || f.type === 'text');
const enumFields = fields.filter((f) => f.type === 'enum');
const labelField = stringFields[0]?.name || fields[0].name;
const searchFields = stringFields.map((f) => f.name);
const filterFields = enumFields.map((f) => f.name);
const statusField = enumFields[0]?.name || null;
const currencyFields = fields.filter((f) => f.type === 'currency');
const refFields = fields.filter((f) => f.type === 'ref');

// Money is Decimal(12,2) in the DB (never Float — no rounding drift), so routes
// must convert it back to a JS number before sending JSON. These bits inject a
// tiny `serialize` into the generated routes only when the model has money.
const hasMoney = currencyFields.length > 0;
const serializeDef = hasMoney
  ? `\nconst serialize = (r: ${Model}) => ({ ...r, ${currencyFields.map((f) => `${f.name}: Number(r.${f.name})`).join(', ')} });\n`
  : '';
const listExpr = hasMoney ? 'rows.map(serialize)' : 'rows';
const wrapOne = (e) => (hasMoney ? `serialize(${e})` : e);

// ---- write ----
appendSchema();
writeFile(`src/lib/schemas/${modelCamel}.ts`, zodTemplate());
writeFile(`src/app/api/${plural}/route.ts`, listRouteTemplate());
writeFile(`src/app/api/${plural}/[id]/route.ts`, idRouteTemplate());
writeFile(`src/app/(app)/${plural}/page.tsx`, pageTemplate());
registerNav();

console.log(`\n✅ Module "${Model}" generated.\n`);
console.log(`   prisma/schema.prisma        (+ model ${Model}${enumFields.length ? ' + enums' : ''})`);
console.log(`   src/lib/schemas/${modelCamel}.ts`);
console.log(`   src/app/api/${plural}/route.ts  + [id]/route.ts`);
console.log(`   src/app/(app)/${plural}/page.tsx`);
console.log(`   + sidebar entry in src/config/nav.ts\n`);
console.log(`Next:  npm run db:push   (creates the table + regenerates the client)`);
console.log(`Then restart the dev server. Your module is at /${plural}\n`);

// ============================ templates ============================

function appendSchema() {
  const file = path.join(ROOT, 'prisma/schema.prisma');
  let src = fs.readFileSync(file, 'utf8');
  if (src.includes(`model ${Model} {`)) {
    console.warn(`⚠️  Model ${Model} already in schema — skipping schema edit.`);
    return;
  }
  const enums = enumFields
    .map((f) => `enum ${enumName(f)} {\n${f.options.map((o) => `  ${o}`).join('\n')}\n}`)
    .join('\n\n');
  // Index the columns queries actually filter on: the owner (+ status, so the
  // common "my rows with status X" scan is one B-tree), and every ref/FK column.
  const indexLines = [
    `  @@index([createdById${statusField ? `, ${statusField}` : ''}])`,
    ...refFields.map((f) => `  @@index([${f.name}Id])`),
  ].join('\n');
  const modelBlock = `model ${Model} {
  id        String   @id @default(cuid())
${fields.map((f) => '  ' + schemaField(f)).join('\n')}
  createdById String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

${indexLines}
}`;
  src += `\n${enums ? enums + '\n\n' : ''}${modelBlock}\n`;
  fs.writeFileSync(file, src);
}

function zodTemplate() {
  const lines = fields.map((f) => `  ${f.name}: ${zodField(f)},`).join('\n');
  return `import { z } from 'zod';

export const ${modelCamel}CreateSchema = z.object({
${lines}
});

export const ${modelCamel}UpdateSchema = ${modelCamel}CreateSchema.partial();

export type ${Model}Input = z.infer<typeof ${modelCamel}CreateSchema>;
`;
}

function listRouteTemplate() {
  return `import { NextResponse } from 'next/server';
import { ${hasMoney ? `Prisma, type ${Model}` : 'Prisma'} } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { listQuerySchema } from '@/lib/validation';
import { ${modelCamel}CreateSchema } from '@/lib/schemas/${modelCamel}';
import { buildListArgs, paginated } from '@/lib/crud';
import { logActivity } from '@/lib/activity';
import { route } from '@/lib/api-error';

const LIST = { searchFields: ${JSON.stringify(searchFields)}, filterFields: ${JSON.stringify(filterFields)}, ownerField: 'createdById' };
${serializeDef}
export const GET = route(async (req: Request) => {
  const user = await requireUser();
  const query = listQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  const args = buildListArgs(query, LIST, user.id);
  const where = args.where as Prisma.${Model}WhereInput;
  const [rows, total] = await Promise.all([
    prisma.${modelCamel}.findMany({ where, orderBy: args.orderBy as Prisma.${Model}OrderByWithRelationInput, skip: args.skip, take: args.take }),
    prisma.${modelCamel}.count({ where }),
  ]);
  return NextResponse.json(paginated(${listExpr}, total, query));
});

export const POST = route(async (req: Request) => {
  const user = await requireUser();
  const data = ${modelCamel}CreateSchema.parse(await req.json());
  const row = await prisma.${modelCamel}.create({ data: { ...data, createdById: user.id } });
  await logActivity({ action: 'create', entity: '${plural}', entityId: row.id, summary: String(row.${labelField} ?? row.id), userId: user.id, userName: user.name });
  return NextResponse.json(${wrapOne('row')}, { status: 201 });
});
`;
}

function idRouteTemplate() {
  return `import { NextResponse } from 'next/server';${hasMoney ? `\nimport type { ${Model} } from '@prisma/client';` : ''}
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { ${modelCamel}UpdateSchema } from '@/lib/schemas/${modelCamel}';
import { logActivity } from '@/lib/activity';
import { ApiError, route } from '@/lib/api-error';

type Ctx = { params: Promise<{ id: string }> };
${serializeDef}
async function owned(id: string, userId: string) {
  const row = await prisma.${modelCamel}.findFirst({ where: { id, createdById: userId } });
  if (!row) throw ApiError.notFound('${Model} not found');
  return row;
}

export const GET = route(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  return NextResponse.json(${wrapOne('await owned(id, user.id)')});
});

export const PATCH = route(async (req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  await owned(id, user.id);
  const data = ${modelCamel}UpdateSchema.parse(await req.json());
  const row = await prisma.${modelCamel}.update({ where: { id }, data });
  await logActivity({ action: 'update', entity: '${plural}', entityId: id, summary: String(row.${labelField} ?? row.id), userId: user.id, userName: user.name });
  return NextResponse.json(${wrapOne('row')});
});

export const DELETE = route(async (_req: Request, { params }: Ctx) => {
  const user = await requireUser();
  const { id } = await params;
  const row = await owned(id, user.id);
  await prisma.${modelCamel}.delete({ where: { id } });
  await logActivity({ action: 'delete', entity: '${plural}', entityId: id, summary: String(row.${labelField} ?? row.id), userId: user.id, userName: user.name });
  return NextResponse.json({ message: 'Deleted', id });
});
`;
}

function pageTemplate() {
  const needsBadge = enumFields.length > 0;
  const needsCurrency = fields.some((f) => f.type === 'currency');
  const needsDate = fields.some((f) => f.type === 'date');
  const fmtImports = [needsCurrency && 'formatCurrency', needsDate && 'formatDate'].filter(Boolean).join(', ');

  const typeLines = fields.map((f) => `  ${f.name}: ${tsType(f)};`).join('\n');
  const columns = fields.map(columnLine).join('\n');
  const formFields = fields.map(fieldLine).join('\n');

  return `'use client';
${needsBadge ? "import { Badge } from '@/components/ui/kit';\n" : ''}import { CrudPage } from '@/components/ui/CrudPage';
import type { Column } from '@/components/ui/DataTable';
import type { FieldDef } from '@/components/ui/EntityForm';
${fmtImports ? `import { ${fmtImports} } from '@/lib/format';\n` : ''}
type ${Model} = {
  id: string;
${typeLines}
  createdAt: string;
};

const COLUMNS: Column<${Model}>[] = [
${columns}
];

const FIELDS: FieldDef[] = [
${formFields}
];

export default function ${Plural}Page() {
  return (
    <CrudPage<${Model}>
      title="${Plural}"
      singular="${modelCamel}"
      resourcePath="/${plural}"
      columns={COLUMNS}
      fields={FIELDS}
      searchPlaceholder="Search ${plural}…"
    />
  );
}
`;
}

// ---- per-field emitters ----
function schemaField(f) {
  const req = f.name === labelField;
  switch (f.type) {
    case 'number':
      return `${f.name} Int @default(0)`;
    case 'currency':
      return `${f.name} Decimal @default(0) @db.Decimal(12, 2)`;
    case 'boolean':
      return `${f.name} Boolean @default(false)`;
    case 'date':
      return `${f.name} String?`; // ISO string — robust for generic code
    case 'enum':
      return `${f.name} ${enumName(f)} @default(${f.options[0]})`;
    case 'ref':
      return `${f.name}Id String?`;
    default:
      return `${f.name} String${req ? '' : '?'}`;
  }
}

function zodField(f) {
  const req = f.name === labelField;
  switch (f.type) {
    case 'number':
      return 'z.coerce.number().int().default(0)';
    case 'currency':
      return 'z.coerce.number().default(0)';
    case 'boolean':
      return 'z.boolean().default(false)';
    case 'date':
      return "z.string().optional().default('')";
    case 'enum':
      return `z.enum(${JSON.stringify(f.options)}).default('${f.options[0]}')`;
    case 'ref':
      return "z.string().optional().default('')";
    default:
      return req ? "z.string().min(1, 'Required')" : "z.string().optional().default('')";
  }
}

function tsType(f) {
  switch (f.type) {
    case 'number':
    case 'currency':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'enum':
      return f.options.map((o) => `'${o}'`).join(' | ');
    default:
      return 'string';
  }
}

function columnLine(f) {
  const label = titleCase(f.name);
  const base = `{ key: '${f.name}', label: '${label}'`;
  switch (f.type) {
    case 'enum':
      return `  ${base}, filter: ${JSON.stringify(f.options)}, render: (r) => <Badge>{r.${f.name}}</Badge> },`;
    case 'currency':
      return `  ${base}, align: 'right', sortable: true, render: (r) => formatCurrency(r.${f.name}), exportValue: (r) => r.${f.name} },`;
    case 'number':
      return `  ${base}, align: 'right', sortable: true },`;
    case 'boolean':
      return `  ${base}, render: (r) => (r.${f.name} ? 'Yes' : 'No') },`;
    case 'date':
      return `  ${base}, sortable: true, render: (r) => formatDate(r.${f.name}) },`;
    default:
      return `  ${base}, sortable: true },`;
  }
}

function fieldLine(f) {
  const label = titleCase(f.name);
  const req = f.name === labelField ? ', required: true' : '';
  switch (f.type) {
    case 'enum':
      return `  { name: '${f.name}', label: '${label}', type: 'select', options: ${JSON.stringify(f.options)} },`;
    case 'currency':
      return `  { name: '${f.name}', label: '${label}', type: 'currency' },`;
    case 'number':
      return `  { name: '${f.name}', label: '${label}', type: 'number' },`;
    case 'boolean':
      return `  { name: '${f.name}', label: '${label}', type: 'checkbox' },`;
    case 'date':
      return `  { name: '${f.name}', label: '${label}', type: 'date' },`;
    case 'text':
      return `  { name: '${f.name}', label: '${label}', type: 'textarea'${req} },`;
    default:
      return `  { name: '${f.name}', label: '${label}'${req} },`;
  }
}

function registerNav() {
  const file = path.join(ROOT, 'src/config/nav.ts');
  let src = fs.readFileSync(file, 'utf8');
  if (src.includes(`href: '/${plural}'`)) return;
  const entry = `  { href: '/${plural}', label: '${Plural}', icon: Package, search: { path: '/${plural}', titleKey: '${labelField}' } },`;
  if (!src.includes('Package')) {
    // ensure the icon is imported
    src = src.replace(/from 'lucide-react';/, (m) => m).replace(/import \{ ([^}]+) \}/, (m, g) => `import { ${g.includes('Package') ? g : 'Package, ' + g} }`);
  }
  src = src.replace('  // [generator:nav]', `${entry}\n  // [generator:nav]`);
  fs.writeFileSync(file, src);
}

// ============================ helpers ============================
function parseField(raw) {
  const [name, type = 'string', opts] = raw.split(':');
  const f = { name, type };
  if (type === 'enum') f.options = (opts || 'active,archived').split(',');
  return f;
}
function enumName(f) {
  return `${Model}${titleCase(f.name).replace(/\s/g, '')}`;
}
function writeFile(rel, content) {
  const abs = path.join(ROOT, rel);
  if (fs.existsSync(abs) && !force) {
    console.warn(`⚠️  Skipped ${rel} (exists — use --force to overwrite)`);
    return;
  }
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
}
function titleCase(s) {
  return s.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
function pluralize(w) {
  if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'ies';
  if (/(s|x|z|ch|sh)$/.test(w)) return w + 'es';
  return w + 's';
}
