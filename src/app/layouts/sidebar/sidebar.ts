import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
  afterNextRender,
  inject,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MenuItem } from './menu.model';
import { MENU } from './menu';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  @ViewChild('sideMenu') sideMenu!: ElementRef;
  @Output() mobileMenuButtonClicked = new EventEmitter();

  menuItems: MenuItem[] = [];
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  constructor() {
    afterNextRender(() => this.initActiveMenu());
  }

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    const role = user?.role ?? '';
    const roleList = Array.isArray(role) ? role : (role ? [role] : []);
    const normalizedRoles = roleList.map((r) => String(r).toUpperCase());
    // Default to USER when no role (backend may not return role for regular users)
    const rolesToCheck = normalizedRoles.length > 0 ? normalizedRoles : ['USER'];
    this.menuItems = MENU.filter(
      (item) =>
        !item.role ||
        rolesToCheck.includes(String(item.role ?? '').toUpperCase())
    );
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.initActiveMenu();
      }
    });
  }

  ngAfterViewInit(): void {
    this.initActiveMenu();
  }

  removeActivation(items: HTMLElement[]): void {
    items.forEach((item: HTMLElement) => {
      if (item.classList.contains('menu-link')) {
        if (!item.classList.contains('active')) {
          item.setAttribute('aria-expanded', 'false');
        }
        const next = item.nextElementSibling as HTMLElement;
        if (next) next.classList.remove('show');
      }
      if (item.classList.contains('nav-link')) {
        const next = item.nextElementSibling as HTMLElement;
        if (next) next.classList.remove('show');
        item.setAttribute('aria-expanded', 'false');
      }
      item.classList.remove('active');
    });
  }

  toggleItem(event: Event): void {
    const target = event.target as HTMLElement;
    const isCurrentMenuId = target.closest('a.nav-link') as HTMLElement;
    if (!isCurrentMenuId) return;
    const isMenu = isCurrentMenuId.nextElementSibling as HTMLElement;
    if (isMenu?.classList.contains('show')) {
      isMenu.classList.remove('show');
      isCurrentMenuId.setAttribute('aria-expanded', 'false');
    } else {
      document.querySelectorAll('#navbar-nav .show').forEach((node) => {
        node.classList.remove('show');
      });
      if (isMenu) isMenu.classList.add('show');
      const ul = document.getElementById('navbar-nav');
      if (ul) {
        const iconItems = Array.from(ul.getElementsByTagName('a'));
        iconItems
          .filter((x) => x.classList.contains('active'))
          .forEach((item) => {
            item.setAttribute('aria-expanded', 'false');
            item.classList.remove('active');
          });
      }
      isCurrentMenuId.setAttribute('aria-expanded', 'true');
      this.activateParentDropdown(isCurrentMenuId);
    }
  }

  toggleSubItem(event: Event): void {
    const target = event.target as HTMLElement;
    const isCurrentMenuId = target.closest('a.nav-link') as HTMLElement;
    if (!isCurrentMenuId) return;
    const isMenu = isCurrentMenuId.nextElementSibling as HTMLElement;
    if (isMenu?.classList.contains('show')) {
      isMenu.classList.remove('show');
      isCurrentMenuId.setAttribute('aria-expanded', 'false');
    } else {
      document.querySelectorAll('.sub-menu').forEach((node) => {
        node.classList.remove('show');
      });
      document.querySelectorAll('.menu-dropdown .nav-link').forEach((submenu) => {
        submenu.setAttribute('aria-expanded', 'false');
      });
      isCurrentMenuId.setAttribute('aria-expanded', 'true');
      if (target.nextElementSibling) {
        (target.nextElementSibling as HTMLElement).classList.toggle('show');
      }
    }
  }

  toggleExtraSubItem(event: Event): void {
    const target = event.target as HTMLElement;
    const isCurrentMenuId = target.closest('a.nav-link') as HTMLElement;
    if (!isCurrentMenuId) return;
    const isMenu = isCurrentMenuId.nextElementSibling as HTMLElement;
    if (isMenu?.classList.contains('show')) {
      isMenu.classList.remove('show');
      isCurrentMenuId.setAttribute('aria-expanded', 'false');
    } else {
      document.querySelectorAll('.extra-sub-menu').forEach((node) => {
        node.classList.remove('show');
      });
      document.querySelectorAll('.menu-dropdown .nav-link').forEach((submenu) => {
        submenu.setAttribute('aria-expanded', 'false');
      });
      isCurrentMenuId.setAttribute('aria-expanded', 'true');
      if (target.nextElementSibling) {
        (target.nextElementSibling as HTMLElement).classList.toggle('show');
      }
    }
  }

  toggleParentItem(event: Event): void {
    const target = event.target as HTMLElement;
    const isCurrentMenuId = target.closest('a.nav-link') as HTMLElement;
    if (!isCurrentMenuId) return;
    document.querySelectorAll('#navbar-nav .show').forEach((node) => {
      node.classList.remove('show');
    });
    const ul = document.getElementById('navbar-nav');
    if (ul) {
      const iconItems = Array.from(ul.getElementsByTagName('a'));
      iconItems
        .filter((x) => x.classList.contains('active'))
        .forEach((item) => {
          item.setAttribute('aria-expanded', 'false');
          item.classList.remove('active');
        });
    }
    isCurrentMenuId.setAttribute('aria-expanded', 'true');
    this.activateParentDropdown(isCurrentMenuId);
  }

  activateParentDropdown(item: HTMLElement): void {
    item.classList.add('active');
    const parentCollapseDiv = item.closest('.collapse.menu-dropdown') as HTMLElement;
    if (parentCollapseDiv) {
      parentCollapseDiv.classList.add('show');
      const parent = parentCollapseDiv.parentElement;
      if (parent?.children[0]) {
        (parent.children[0] as HTMLElement).classList.add('active');
        (parent.children[0] as HTMLElement).setAttribute('aria-expanded', 'true');
      }
      const grandParent = parent?.closest('.collapse.menu-dropdown') as HTMLElement;
      if (grandParent) {
        grandParent.classList.add('show');
        const prev = grandParent.previousElementSibling as HTMLElement;
        if (prev) prev.classList.add('active');
        const greatGrand = prev?.closest('.collapse') as HTMLElement;
        if (greatGrand) {
          greatGrand.classList.add('show');
          const prevPrev = greatGrand.previousElementSibling as HTMLElement;
          if (prevPrev) prevPrev.classList.add('active');
        }
      }
    }
  }

  updateActive(event: Event): void {
    const ul = document.getElementById('navbar-nav');
    if (ul) {
      const items = Array.from(ul.querySelectorAll('a.nav-link')) as HTMLElement[];
      this.removeActivation(items);
    }
    this.activateParentDropdown((event.target as HTMLElement).closest('a.nav-link') as HTMLElement);
  }

  initActiveMenu(): void {
    const pathName = this.router.url.split('?')[0];
    const ul = document.getElementById('navbar-nav');
    if (!ul) return;
    const items = Array.from(ul.querySelectorAll('a.nav-link')) as HTMLElement[];
    const activeItems = items.filter((x) => x.classList.contains('active'));
    this.removeActivation(activeItems);
    const matchingMenuItem = items.find((x) => {
      const link = x.getAttribute('data-link') || x.getAttribute('href') || '';
      const normalized = link.replace(/^.*#/, '').split('?')[0].replace(/^\//, '') || '';
      const path = pathName.replace(/^\//, '') || '';
      if (!normalized) return false;
      return path === normalized || path.startsWith(normalized + '/');
    });
    if (matchingMenuItem) {
      this.activateParentDropdown(matchingMenuItem);
    }
  }

  hasItems(item: MenuItem): boolean {
    return item.subItems !== undefined ? item.subItems.length > 0 : false;
  }

  toggleMobileMenu(_event: Event): void {
    const sidebarsize = document.documentElement.getAttribute('data-sidebar-size');
    document.documentElement.setAttribute(
      'data-sidebar-size',
      sidebarsize === 'sm-hover-active' ? 'sm-hover' : 'sm-hover-active'
    );
    setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
  }

  SidebarHide(): void {
    document.body.classList.remove('vertical-sidebar-enable');
  }

  logout(): void {
    this.auth.logout();
  }
}
