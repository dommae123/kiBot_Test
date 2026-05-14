import React from 'react';
import { clsx } from 'clsx';
export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={clsx('card', className)} {...props} />;
export const Button = ({ className, variant = 'default', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default'|'primary'|'ghost'|'destructive' }) => <button className={clsx('btn', variant === 'primary' && 'btn-primary', variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:opacity-90', className)} {...props} />;
export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input className={clsx('input w-full', props.className)} {...props} />;
export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select className={clsx('input w-full', props.className)} {...props} />;
export const Badge = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => <span className={clsx('badge', className)} {...props} />;
export const QualityBadge = ({ quality }: { quality: 'green'|'yellow'|'red' }) => <Badge className={clsx(quality === 'green' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', quality === 'yellow' && 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300', quality === 'red' && 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300')}>{quality === 'green' ? 'Grün' : quality === 'yellow' ? 'Gelb' : 'Rot'}</Badge>;
