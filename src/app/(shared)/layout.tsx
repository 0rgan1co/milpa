import { ThemeToggle } from "@/components/layout/theme-toggle";
import Link from "next/link";

export default function SharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between h-16 px-6 bg-background border-b border-border">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-xl font-bold">
            Milpa
          </Link>
          <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-[10px] font-bold uppercase tracking-wider">
            Viewer
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
