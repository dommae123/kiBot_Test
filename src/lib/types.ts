export type Quality = 'green' | 'yellow' | 'red';
export type View = 'import' | 'dashboard' | 'explorer' | 'categories' | 'missing' | 'favorites' | 'project' | 'compare' | 'settings';

export interface Part {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  manufacturer?: string;
  mpn?: string;
  value?: string;
  symbol?: string;
  symbolLibrary?: string;
  footprint?: string;
  footprintLibrary?: string;
  footprintPath?: string;
  library?: string;
  package?: string;
  pins?: number;
  mount?: 'SMD' | 'THT' | 'BGA' | 'Mixed' | 'Unknown';
  tags: string[];
  parameters: Record<string, string>;
  raw: Record<string, unknown>;
  quality: Quality;
  warnings: string[];
  heuristicCategory: boolean;
}

export interface ImportedLibrary {
  parts: Part[];
  symbolLibraries: string[];
  footprintLibraries: string[];
  sourceFiles: string[];
  tables: ImportTable[];
  importedAt: string;
}

export interface ImportTable {
  name: string;
  columns: string[];
  rowCount: number;
}

export interface AppSettings {
  darkMode: boolean;
  compactTable: boolean;
  visibleColumns: string[];
  qualityRules: {
    requireDescription: boolean;
    requireMpn: boolean;
    requireFootprint: boolean;
    requireSymbol: boolean;
  };
}

export interface ProjectItem {
  partId: string;
  note: string;
  addedAt: string;
}

export interface FilterState {
  query: string;
  categories: string[];
  symbolLibraries: string[];
  footprintLibraries: string[];
  manufacturers: string[];
  mounts: string[];
  packages: string[];
  pinCounts: string[];
  hasMpn?: boolean;
  hasFootprint?: boolean;
  qualities: Quality[];
}
