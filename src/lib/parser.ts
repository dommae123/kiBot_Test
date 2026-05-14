import initSqlJs from 'sql.js';
import Papa from 'papaparse';
import { buildImported, normalizePart } from './normalizer';
import { ImportedLibrary, Part } from './types';

export async function parseFiles(files: File[]): Promise<ImportedLibrary> {
  const parts: Part[] = [];
  const tables: ImportedLibrary['tables'] = [];
  const sourceFiles = files.map((f) => f.name);
  const errors: string[] = [];
  for (const file of files) {
    try {
      if (/\.sqlite$|\.db$/i.test(file.name)) {
        const parsed = await parseSqlite(file);
        parts.push(...parsed.parts); tables.push(...parsed.tables);
      } else if (/\.json$/i.test(file.name)) {
        const data = JSON.parse(await file.text());
        const rows = Array.isArray(data) ? data : Array.isArray(data.parts) ? data.parts : [];
        parts.push(...rows.map((r, i) => normalizePart(r, `${file.name}-${i}`)));
      } else if (/\.csv$/i.test(file.name)) {
        const parsed = Papa.parse(await file.text(), { header: true, skipEmptyLines: true });
        parts.push(...parsed.data.map((r, i) => normalizePart(r, `${file.name}-${i}`)));
      } else if (/\.kicad_sym$/i.test(file.name)) {
        const text = await file.text();
        parts.push(...parseKiCadSym(text, file.name));
      } else if (/fp-lib-table|sym-lib-table|\.kicad_dbl$/i.test(file.name)) {
        // metadata files are accepted; their names are included in sourceFiles and future mapping dialogs can use them.
      }
    } catch (e) {
      errors.push(`${file.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  if (!parts.length && errors.length) throw new Error(errors.join('\n'));
  return buildImported(parts, sourceFiles, tables);
}

async function parseSqlite(file: File): Promise<ImportedLibrary> {
  const SQL = await initSqlJs({ locateFile: (name) => `https://sql.js.org/dist/${name}` });
  const db = new SQL.Database(new Uint8Array(await file.arrayBuffer()));
  const tableResult = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  const tableNames = tableResult[0]?.values.map((v) => String(v[0])) ?? [];
  const tables: ImportedLibrary['tables'] = [];
  const scored: { table: string; columns: string[]; rows: Record<string, unknown>[]; score: number }[] = [];
  for (const table of tableNames) {
    const quoted = `"${table.replace(/"/g, '""')}"`;
    const info = db.exec(`PRAGMA table_info(${quoted})`)[0];
    const columns = info?.values.map((v) => String(v[1])) ?? [];
    const count = Number(db.exec(`SELECT COUNT(*) FROM ${quoted}`)[0]?.values[0]?.[0] ?? 0);
    tables.push({ name: table, columns, rowCount: count });
    if (!count) continue;
    const result = db.exec(`SELECT * FROM ${quoted} LIMIT 50000`)[0];
    if (!result) continue;
    const rows = result.values.map((values) => Object.fromEntries(result.columns.map((col, i) => [col, values[i]])));
    const cols = columns.join(' ').toLowerCase();
    const score = ['name', 'description', 'mpn', 'manufacturer', 'footprint', 'symbol', 'value'].reduce((s, k) => s + (cols.includes(k) ? 1 : 0), 0) + Math.min(count / 100, 3);
    scored.push({ table, columns, rows, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  const parts = best ? best.rows.map((r, i) => normalizePart(r, `${best.table}-${i}`)) : [];
  db.close();
  return buildImported(parts, [file.name], tables);
}

function parseKiCadSym(text: string, fileName: string): Part[] {
  const lib = fileName.replace(/\.kicad_sym$/i, '');
  const matches = [...text.matchAll(/\(symbol\s+"?([^"\s)]+)"?/g)];
  return matches.slice(0, 5000).map((m, i) => normalizePart({ name: m[1], symbol: `${lib}:${m[1]}`, description: `Symbol aus ${fileName}`, keywords: lib }, `${fileName}-${i}`));
}
