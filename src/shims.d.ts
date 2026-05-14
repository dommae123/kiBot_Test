declare namespace React { type HTMLAttributes<T> = any; type ButtonHTMLAttributes<T> = any; type InputHTMLAttributes<T> = any; type SelectHTMLAttributes<T> = any; type ElementType = any; }
declare module 'react' {
  const React: any;
  export default React;
  export function useState<T = any>(initial?: T | (() => T)): [T, (value: T | ((previous: T) => T)) => void];
  export function useEffect(effect: any, deps?: any[]): void;
  export function useMemo<T = any>(factory: () => T, deps?: any[]): T;
  export type HTMLAttributes<T> = any; export type ButtonHTMLAttributes<T> = any; export type InputHTMLAttributes<T> = any; export type SelectHTMLAttributes<T> = any; export type ElementType = any;
}
declare module 'react-dom/client' { export const createRoot: any; }
declare module 'lucide-react' { export const AlertTriangle:any; export const BarChart3:any; export const Database:any; export const Download:any; export const FileDown:any; export const GitCompare:any; export const Heart:any; export const LayoutDashboard:any; export const ListChecks:any; export const Moon:any; export const PackageSearch:any; export const Plus:any; export const Search:any; export const Settings:any; export const Star:any; export const TableProperties:any; export const Trash2:any; export const UploadCloud:any; }
declare module 'recharts' { export const Bar:any; export const BarChart:any; export const CartesianGrid:any; export const Cell:any; export const Pie:any; export const PieChart:any; export const ResponsiveContainer:any; export const Tooltip:any; export const XAxis:any; export const YAxis:any; }
declare module 'sql.js' { const initSqlJs: any; export default initSqlJs; }
declare module 'papaparse' { const Papa: any; export default Papa; }
declare module 'clsx' { export const clsx: (...args:any[]) => string; }
declare module '*.css';
declare namespace JSX { interface IntrinsicElements { [elemName: string]: any } }
