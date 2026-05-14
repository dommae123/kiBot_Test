import { FilterState, ImportedLibrary, Part, Quality } from './types';

const aliases: Record<string, string[]> = {
  name: ['name', 'part', 'part name', 'component', 'symbol name', 'reference'],
  description: ['description', 'desc', 'comment', 'summary'],
  manufacturer: ['manufacturer', 'mfr', 'vendor', 'producer'],
  mpn: ['mpn', 'manufacturer part number', 'partnumber', 'part number', 'order code', 'pn'],
  value: ['value', 'val'],
  footprint: ['footprint', 'pcb footprint', 'footprintname', 'package footprint'],
  symbol: ['symbol', 'schematic symbol', 'symbolname', 'sch symbol'],
  category: ['category', 'class', 'type', 'group'],
  package: ['package', 'case', 'housing', 'gehaeuse', 'gehäuse'],
  pins: ['pins', 'pin count', 'pincount', 'number of pins'],
  keywords: ['keywords', 'tags', 'search terms']
};

const techAliases = ['voltage', 'current', 'power', 'resistance', 'capacitance', 'inductance', 'tolerance', 'temperature', 'rohs', 'lifecycle', 'status', 'dielectric'];

const normalizeKey = (key: string) => key.toLowerCase().replace(/[_-]+/g, ' ').trim();
const val = (row: Record<string, unknown>, keys: string[]) => {
  const entries = Object.entries(row);
  for (const alias of keys) {
    const found = entries.find(([key]) => normalizeKey(key) === alias || normalizeKey(key).includes(alias));
    if (found && found[1] !== null && found[1] !== undefined && String(found[1]).trim() !== '') return String(found[1]).trim();
  }
  return undefined;
};

export function splitLibraryRef(ref?: string) {
  if (!ref) return { library: undefined, name: undefined };
  const [library, ...rest] = ref.split(':');
  return rest.length ? { library, name: rest.join(':') } : { library: undefined, name: ref };
}

export function inferCategory(rowText: string, explicit?: string) {
  const text = `${explicit ?? ''} ${rowText}`.toLowerCase();
  const rules: [string, string | undefined, RegExp][] = [
    ['Widerstände', 'Shunt', /shunt|current sense/], ['Widerstände', 'SMD', /resistor|widerstand|\bres\b|\br_\d|\b[0-9.]+ ?(r|ohm|k|m)\b/],
    ['Kondensatoren', 'Keramik', /ceramic|x7r|x5r|np0|c0g/], ['Kondensatoren', 'Elektrolyt', /electrolytic|elko/], ['Kondensatoren', 'Tantal', /tantal/], ['Kondensatoren', 'Film', /film capacitor/], ['Kondensatoren', undefined, /capacitor|kondensator|\bcap\b/],
    ['Induktivitäten', undefined, /inductor|indukt|\bl_\d/], ['Dioden', 'TVS', /tvs|esd/], ['Dioden', 'Zener', /zener/], ['Dioden', 'Schottky', /schottky/], ['Dioden', undefined, /diode|rectifier/],
    ['MOSFETs', 'N-Kanal', /n.?channel|nmos/], ['MOSFETs', 'P-Kanal', /p.?channel|pmos/], ['MOSFETs', undefined, /mosfet|fet/], ['Transistoren', undefined, /transistor|bjt/],
    ['Regler', undefined, /ldo|regulator|dc.?dc|buck|boost/], ['Operationsverstärker', undefined, /op.?amp|operational amplifier|amplifier/], ['Logik-ICs', undefined, /logic|74hc|74lvc|gate/], ['Mikrocontroller', undefined, /microcontroller|mcu|stm32|avr|pic/],
    ['Steckverbinder', 'USB', /usb/], ['Steckverbinder', 'RJ45', /rj45|ethernet/], ['Steckverbinder', 'D-Sub', /d-sub|dsub/], ['Steckverbinder', 'Pin Header', /pin header|header/], ['Steckverbinder', 'Wire-to-Board', /wire.?to.?board|micro-fit|molex/], ['Steckverbinder', undefined, /connector|conn_|steck/],
    ['Sicherungen', undefined, /fuse|sicherung/], ['Relais', undefined, /relay|relais/], ['Quarze/Oszillatoren', undefined, /crystal|quartz|oscillator/], ['Sensoren', undefined, /sensor/], ['Leistungshalbleiter', undefined, /igbt|thyristor|triac/], ['Mechanik', undefined, /mounting|mechanical|screw|spacer/]
  ];
  const hit = rules.find(([, , rx]) => rx.test(text));
  if (explicit && explicit.trim()) return { category: hit?.[0] ?? explicit, subcategory: hit?.[1], heuristic: !hit };
  if (hit) return { category: hit[0], subcategory: hit[1], heuristic: true };
  return { category: 'Unklar / manuell prüfen', subcategory: undefined, heuristic: true };
}

export function inferMount(text: string): Part['mount'] {
  const t = text.toLowerCase();
  if (/bga|fbga|ubga/.test(t)) return 'BGA';
  if (/smd|sot|soic|qfn|qfp|dfn|0603|0805|1206|2512|metric|sod/.test(t)) return 'SMD';
  if (/tht|through.?hole|p[0-9.]+mm|vertical|dip/.test(t)) return 'THT';
  return 'Unknown';
}

export function normalizePart(row: Record<string, unknown>, fallbackId: string): Part {
  const name = val(row, aliases.name) ?? val(row, aliases.mpn) ?? `Bauteil ${fallbackId}`;
  const description = val(row, aliases.description);
  const manufacturer = val(row, aliases.manufacturer);
  const mpn = val(row, aliases.mpn);
  const value = val(row, aliases.value);
  const footprint = val(row, aliases.footprint);
  const symbol = val(row, aliases.symbol);
  const packageName = val(row, aliases.package);
  const pinsRaw = val(row, aliases.pins);
  const text = Object.values(row).join(' ');
  const inferred = inferCategory(text, val(row, aliases.category));
  const symbolRef = splitLibraryRef(symbol);
  const footprintRef = splitLibraryRef(footprint);
  const parameters: Record<string, string> = {};
  Object.entries(row).forEach(([key, value]) => {
    const nk = normalizeKey(key);
    if (techAliases.some((alias) => nk.includes(alias)) && value !== undefined && value !== null) parameters[key] = String(value);
  });
  const warnings: string[] = [];
  if (!footprint) warnings.push('Kein Footprint zugeordnet');
  if (!mpn) warnings.push('Keine Herstellerteilenummer');
  if (!description) warnings.push('Keine Beschreibung');
  if (footprint) warnings.push('Footprint muss gegen Datenblatt geprüft werden');
  if (inferred.heuristic) warnings.push('Kategorie nur heuristisch erkannt');
  let quality: Quality = 'green';
  if (!symbol || !footprint || !mpn) quality = 'red';
  else if (!description || warnings.some((w) => w.includes('heuristisch'))) quality = 'yellow';
  return {
    id: String(row.id ?? row.ID ?? fallbackId), name, description, category: inferred.category, subcategory: inferred.subcategory,
    manufacturer, mpn, value, symbol, symbolLibrary: symbolRef.library, footprint, footprintLibrary: footprintRef.library,
    footprintPath: footprint, library: symbolRef.library ?? footprintRef.library, package: packageName, pins: pinsRaw ? Number.parseInt(pinsRaw, 10) || undefined : undefined,
    mount: inferMount(`${text} ${footprint ?? ''} ${packageName ?? ''}`), tags: `${val(row, aliases.keywords) ?? ''} ${text}`.toLowerCase().split(/[^a-z0-9µΩ]+/).filter(Boolean),
    parameters, raw: row, quality, warnings, heuristicCategory: inferred.heuristic
  };
}

export function summarize(parts: Part[]) {
  return {
    parts: parts.length,
    symbolLibraries: new Set(parts.map((p) => p.symbolLibrary).filter(Boolean)).size,
    footprintLibraries: new Set(parts.map((p) => p.footprintLibrary).filter(Boolean)).size,
    categories: new Set(parts.map((p) => p.category)).size,
    withoutFootprint: parts.filter((p) => !p.footprint).length,
    withoutMpn: parts.filter((p) => !p.mpn).length,
    incomplete: parts.filter((p) => p.quality !== 'green').length
  };
}

const synonyms: Record<string, string[]> = { resistor: ['resistor', 'res', 'r', 'widerstand'], capacitor: ['capacitor', 'cap', 'c', 'kondensator'], mosfet: ['mosfet', 'fet', 'transistor'], connector: ['connector', 'stecker', 'conn'], footprint: ['footprint', 'package', 'gehäuse'] };
export function matchesPart(part: Part, query: string) {
  if (!query.trim()) return true;
  const haystack = [part.name, part.description, part.manufacturer, part.mpn, part.value, part.footprint, part.symbol, part.category, part.subcategory, part.package, ...part.tags].join(' ').toLowerCase();
  return query.toLowerCase().split(/\s+/).every((term) => {
    const terms = Object.values(synonyms).find((group) => group.includes(term)) ?? [term];
    return terms.some((t) => haystack.includes(t) || fuzzy(haystack, t));
  });
}
function fuzzy(text: string, term: string) { let i = 0; for (const c of text) if (c === term[i]) i++; return term.length > 2 && i === term.length; }

export function filterParts(parts: Part[], filters: FilterState) {
  return parts.filter((p) => matchesPart(p, filters.query)
    && (!filters.categories.length || filters.categories.includes(p.category))
    && (!filters.symbolLibraries.length || (p.symbolLibrary && filters.symbolLibraries.includes(p.symbolLibrary)))
    && (!filters.footprintLibraries.length || (p.footprintLibrary && filters.footprintLibraries.includes(p.footprintLibrary)))
    && (!filters.manufacturers.length || (p.manufacturer && filters.manufacturers.includes(p.manufacturer)))
    && (!filters.mounts.length || (p.mount && filters.mounts.includes(p.mount)))
    && (!filters.packages.length || (p.package && filters.packages.includes(p.package)))
    && (!filters.pinCounts.length || (p.pins && filters.pinCounts.includes(String(p.pins))))
    && (filters.hasMpn === undefined || Boolean(p.mpn) === filters.hasMpn)
    && (filters.hasFootprint === undefined || Boolean(p.footprint) === filters.hasFootprint)
    && (!filters.qualities.length || filters.qualities.includes(p.quality)));
}

export const emptyFilters = (): FilterState => ({ query: '', categories: [], symbolLibraries: [], footprintLibraries: [], manufacturers: [], mounts: [], packages: [], pinCounts: [], qualities: [] });

export function buildImported(parts: Part[], sourceFiles: string[], tables = [] as ImportedLibrary['tables']): ImportedLibrary {
  return { parts, sourceFiles, tables, importedAt: new Date().toISOString(), symbolLibraries: [...new Set(parts.map((p) => p.symbolLibrary).filter(Boolean) as string[])], footprintLibraries: [...new Set(parts.map((p) => p.footprintLibrary).filter(Boolean) as string[])] };
}
