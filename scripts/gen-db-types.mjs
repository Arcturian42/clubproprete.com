#!/usr/bin/env node
/**
 * Générateur de types DB — remplace `supabase gen types typescript` tant que le
 * projet n'est pas lié (le CLI exige Docker, indisponible dans certains envs).
 * Introspection via psql (JSON) → src/types/database.types.ts au même format
 * que le générateur officiel (Tables Row/Insert/Update, Enums, Functions).
 *
 * Usage :
 *   DATABASE_URL=postgresql://... node scripts/gen-db-types.mjs
 * Prérequis : le schéma (0001+0002) appliqué sur la base ciblée.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const DB = process.env.DATABASE_URL;
if (!DB) {
  console.error('DATABASE_URL manquante');
  process.exit(1);
}

// Fonctions publiques exposées à l'app via rpc() — PostGIS en installe des
// centaines dans public, on liste les nôtres explicitement.
const FUNCTION_WHITELIST = [
  'has_capability',
  'is_entity_member',
  'is_entity_owner',
  'is_conversation_participant',
  'is_blocked',
  'entity_has_members',
  'recalc_entity_capabilities',
  'search_directory',
  'entity_completion_score',
  'search_suggest',
  'rebuild_search_index',
];

function sql(q) {
  const out = execFileSync('psql', [DB, '-Atq', '-c', q], { encoding: 'utf8' }).trim();
  return out ? JSON.parse(out) : [];
}

const columns = sql(`
  select coalesce(json_agg(t order by t.table_name, t.ordinal_position), '[]'::json) from (
    select c.table_name, c.column_name, c.ordinal_position, c.is_nullable,
           c.column_default is not null or c.is_identity = 'YES' as has_default,
           c.data_type, c.udt_name
    from information_schema.columns c
    join information_schema.tables tb
      on tb.table_schema = c.table_schema and tb.table_name = c.table_name
    where c.table_schema = 'public' and tb.table_type = 'BASE TABLE'
      and c.table_name <> 'spatial_ref_sys'
  ) t;`);

const enums = sql(`
  select coalesce(json_agg(t order by t.enum_name), '[]'::json) from (
    select tp.typname as enum_name, json_agg(e.enumlabel order by e.enumsortorder) as labels
    from pg_type tp
    join pg_enum e on e.enumtypid = tp.oid
    join pg_namespace n on n.oid = tp.typnamespace
    where n.nspname = 'public'
    group by tp.typname
  ) t;`);

const functions = sql(`
  select coalesce(json_agg(t order by t.name), '[]'::json) from (
    select p.proname as name,
           pg_get_function_identity_arguments(p.oid) as args,
           pg_get_function_result(p.oid) as result
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any(string_to_array('${FUNCTION_WHITELIST.join(',')}', ','))
  ) t;`);

const enumNames = new Set(enums.map((e) => e.enum_name));

function tsType(dataType, udt) {
  if (udt.startsWith('_')) return `${tsType('', udt.slice(1))}[]`; // array
  if (enumNames.has(udt)) return `Database['public']['Enums']['${udt}']`;
  switch (udt) {
    case 'uuid':
    case 'text':
    case 'varchar':
    case 'bpchar':
    case 'timestamptz':
    case 'timestamp':
    case 'date':
    case 'time':
    case 'citext':
      return 'string';
    case 'int2':
    case 'int4':
    case 'int8':
    case 'float4':
    case 'float8':
    case 'numeric':
      return 'number';
    case 'bool':
      return 'boolean';
    case 'json':
    case 'jsonb':
      return 'Json';
    case 'geography':
    case 'geometry':
      return 'unknown';
    case 'tsvector':
      return 'unknown';
    default:
      return 'unknown';
  }
}

function sqlScalarToTs(t) {
  const s = t.replace(/^SETOF\s+/i, '').trim();
  if (/^(boolean)$/i.test(s)) return 'boolean';
  if (/^(integer|bigint|smallint|numeric|double precision|real)$/i.test(s)) return 'number';
  if (/^(text|uuid|character varying.*|timestamp.*|date)$/i.test(s)) return 'string';
  if (/^(json|jsonb)$/i.test(s)) return 'Json';
  if (/^void$/i.test(s)) return 'undefined';
  if (/^record$/i.test(s)) return 'Record<string, unknown>';
  return 'unknown';
}

// Regroupe les colonnes par table
const tables = new Map();
for (const c of columns) {
  if (!tables.has(c.table_name)) tables.set(c.table_name, []);
  tables.get(c.table_name).push(c);
}

let out = `/**
 * Types de base de données — GÉNÉRÉS par scripts/gen-db-types.mjs.
 * Ne pas éditer à la main. Régénérer :
 *   DATABASE_URL=... node scripts/gen-db-types.mjs
 * (ou \`pnpm db:types\` une fois le projet Supabase lié.)
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
`;

for (const [name, cols] of [...tables.entries()].sort()) {
  const row = cols
    .map((c) => `          ${c.column_name}: ${tsType(c.data_type, c.udt_name)}${c.is_nullable === 'YES' ? ' | null' : ''};`)
    .join('\n');
  const insert = cols
    .map((c) => {
      const optional = c.is_nullable === 'YES' || c.has_default;
      return `          ${c.column_name}${optional ? '?' : ''}: ${tsType(c.data_type, c.udt_name)}${c.is_nullable === 'YES' ? ' | null' : ''};`;
    })
    .join('\n');
  const update = cols
    .map((c) => `          ${c.column_name}?: ${tsType(c.data_type, c.udt_name)}${c.is_nullable === 'YES' ? ' | null' : ''};`)
    .join('\n');
  out += `      ${name}: {
        Row: {
${row}
        };
        Insert: {
${insert}
        };
        Update: {
${update}
        };
        Relationships: [];
      };
`;
}

out += `    };
    Views: Record<string, never>;
    Functions: {
`;
for (const f of functions) {
  const args = (f.args || '')
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a) => {
      const m = a.match(/^(\w+)\s+(.+?)(\s+DEFAULT\s+.+)?$/i);
      if (!m) return null;
      return `${m[1]}${m[3] ? '?' : ''}: ${sqlScalarToTs(m[2])}`;
    })
    .filter(Boolean)
    .join('; ');
  const returns = /^SETOF/i.test(f.result || '')
    ? `${sqlScalarToTs(f.result)}[]`
    : sqlScalarToTs(f.result || 'void');
  const argsType = args ? `{ ${args} }` : 'Record<PropertyKey, never>';
  out += `      ${f.name}: {
        Args: ${argsType};
        Returns: ${returns};
      };
`;
}
out += `    };
    Enums: {
`;
for (const e of enums) {
  out += `      ${e.enum_name}: ${e.labels.map((l) => `'${l}'`).join(' | ')};\n`;
}
out += `    };
    CompositeTypes: Record<string, never>;
  };
};

// Helpers de commodité (mêmes noms que le générateur officiel)
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
`;

writeFileSync(new URL('../src/types/database.types.ts', import.meta.url), out);
console.log(`OK — ${tables.size} tables, ${enums.length} enums, ${functions.length} fonctions.`);
