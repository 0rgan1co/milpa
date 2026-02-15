"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Database,
  Settings,
  Share2,
} from "lucide-react";
import { translations } from "@/lib/constants/i18n";

export function Sidebar() {
  const pathname = usePathname();
  const t = translations.es; // Default to ES for now

  const navigation = [
    { name: t.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { name: t.projects, href: "/projects", icon: Briefcase },
    { name: t.interviews, href: "/interviews", icon: MessageSquare },
    { name: t.narratives, href: "/narratives", icon: Database },
    { name: t.clustering, href: "/clustering", icon: Share2 },
    { name: t.settings, href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex flex-col w-64 bg-sidebar border-r border-sidebar-border h-full">
      <div className="flex items-center justify-center h-16 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground">Milpa</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
