import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    id: 1,
    label: 'Menu',
    isTitle: true,
  },
  {
    id: 2,
    label: 'Dashboard',
    icon: 'ti ti-brand-google-home',
    link: '/dashboard',
  },
  {
    id: 3,
    label: 'Pets',
    icon: 'ri ri-heart-line',
    link: '/pets',
  },
  {
    id: 4,
    label: 'Devices',
    icon: 'ri ri-smartphone-line',
    link: '/devices',
  },
  {
    id: 5,
    label: 'About',
    icon: 'pi pi-info-circle',
    link: '/about',
  },
];
