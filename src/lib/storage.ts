import { AppSettings, ProjectItem } from './types';

const get = <T,>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) ?? '') as T; } catch { return fallback; }
};
const set = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));
export const defaultSettings: AppSettings = { darkMode: false, compactTable: false, visibleColumns: ['name', 'description', 'category', 'manufacturer', 'mpn', 'value', 'symbol', 'footprint', 'package', 'pins', 'quality'], qualityRules: { requireDescription: true, requireMpn: true, requireFootprint: true, requireSymbol: true } };
export const loadFavorites = () => get<string[]>('cern-kicad:favorites', []);
export const saveFavorites = (ids: string[]) => set('cern-kicad:favorites', ids);
export const loadProject = () => get<ProjectItem[]>('cern-kicad:project', []);
export const saveProject = (items: ProjectItem[]) => set('cern-kicad:project', items);
export const loadSettings = () => get<AppSettings>('cern-kicad:settings', defaultSettings);
export const saveSettings = (settings: AppSettings) => set('cern-kicad:settings', settings);
