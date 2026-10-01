import { Compass, Flame, Home, Activity, Network } from 'lucide-react';

export const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/trending', label: 'Trending', icon: Flame },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/lab', label: 'Live Lab', icon: Activity },
  { to: '/architecture', label: 'Architecture', icon: Network },
];
