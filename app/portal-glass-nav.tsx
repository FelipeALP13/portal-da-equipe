"use client";

// Menu lateral do Portal: liga as telas, contadores, marca e conta ao componente de vidro.
import { useMemo, type MouseEvent, type ReactNode } from "react";
import LiquidGlassExpandableSidebar, { type GlassNavGroup, type GlassNavItem, type GlassSidebarItem } from "@/components/ui/liquid-glass-expandable-sidebar";
import type { NavItem, NavSection } from "./sidebar-nav";

const toGlass = (item: NavItem): GlassSidebarItem => ({
  id: item.key,
  label: item.label,
  href: `/painel#${item.key}`,
  icon: item.icon,
  ...(item.badge?.count ? { badge: item.badge.title, count: item.badge.count, countTone: item.badge.tone ?? "info" } : {}),
  ...(item.children?.length ? { children: item.children.map(toGlass) } : {}),
});

export function PortalGlassNav({ sections, activeKey, expanded, onExpandedChange, brand, brandDetail, brandIcon, account, onAccount, accountAction }: {
  sections: NavSection[];
  activeKey: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  brand: string;
  brandDetail?: string;
  brandIcon: ReactNode;
  account: { name: string; detail: string; avatar: ReactNode };
  onAccount: () => void;
  accountAction: ReactNode;
}) {
  const groups = useMemo<GlassNavGroup[]>(() => sections.filter((section) => section.items.length).map((section, index) => ({ label: section.label ?? (index === 0 ? "Início" : "Menu"), items: section.items.map(toGlass) })), [sections]);

  function navigate(item: GlassNavItem, event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (item.id === "profile") { onAccount(); return; }
    for (const section of sections) for (const entry of section.items) {
      if (entry.key === item.id) { (entry.children?.[0] ?? entry).onClick(); return; }
      const child = entry.children?.find((candidate) => candidate.key === item.id);
      if (child) { child.onClick(); return; }
    }
  }

  const initials = account.name.split(/\s+/).slice(0, 2).map((part) => part[0] ?? "").join("").toUpperCase();
  return <LiquidGlassExpandableSidebar
    groups={groups}
    activeId={activeKey}
    brand={brand}
    brandDetail={brandDetail}
    brandIcon={brandIcon}
    expanded={expanded}
    onExpandedChange={onExpandedChange}
    onNavigate={navigate}
    account={{ id: "profile", name: account.name, detail: account.detail, initials, href: "/painel#perfil", avatar: account.avatar }}
    accountAction={accountAction}
    glass={{ blur: 14, opacity: 0.5, saturation: 1.4, edge: 0.85, distortion: 18 }}
    selectionLight={1}
  />;
}
