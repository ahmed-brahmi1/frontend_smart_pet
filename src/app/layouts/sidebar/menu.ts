import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    id: 1,
    label: 'Admin Menu',
    role: 'ADMIN',
    isTitle: true,
  },
  {
    id: 10,
    label: 'User Management',
    icon: 'ri ri-user-line',
    role: 'ADMIN',
    link: '/admin/user-management',
  },
  {
    id: 11,
    label: 'Device Management',
    icon: 'ri ri-smartphone-line',
    role: 'ADMIN',
    link: '/admin/device-management',
  },
  {
    id: 6,
    label: 'Menu',
    isTitle: true,
  },
  {
    id: 2,
    label: 'Dashboard',
    icon: 'ti ti-brand-google-home',
    role: 'USER',
    link: '/dashboard',
  },
  {
    id: 3,
    label: 'Pets',
    icon: 'ri ri-heart-line',
    role: 'USER',
    link: '/pets',
  },
  {
    id: 4,
    label: 'Devices',
    icon: 'ri ri-smartphone-line',
    role: 'USER',
    link: '/devices',
  },
  {
    id: 5,
    label: 'About',
    icon: 'pi pi-info-circle',
    role: 'USER',
    link: '/about',
  },
];
