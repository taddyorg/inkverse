export interface Accent {
  heading: string;
  card: string;
  shadow: string;
  bg: string;
  gradient: string;
}

export const ACCENTS: Accent[] = [
  {
    heading: 'text-brand-pink',
    card: 'border-brand-pink/60',
    shadow: 'shadow-[6px_6px_0_0_theme(colors.brand-pink)]',
    bg: 'bg-brand-pink',
    gradient: 'from-brand-pink to-brand-purple',
  },
  {
    heading: 'text-brand-purple',
    card: 'border-brand-purple/60',
    shadow: 'shadow-[6px_6px_0_0_theme(colors.brand-purple)]',
    bg: 'bg-brand-purple',
    gradient: 'from-brand-purple to-taddy-blue',
  },
  {
    heading: 'text-taddy-blue',
    card: 'border-taddy-blue/60',
    shadow: 'shadow-[6px_6px_0_0_theme(colors.taddy-blue)]',
    bg: 'bg-taddy-blue',
    gradient: 'from-taddy-blue to-action-green',
  },
  {
    heading: 'text-action-green',
    card: 'border-action-green/60',
    shadow: 'shadow-[6px_6px_0_0_theme(colors.action-green)]',
    bg: 'bg-action-green',
    gradient: 'from-action-green to-taddy-blue',
  },
];
