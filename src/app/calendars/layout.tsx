import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendars | Aura",
  description: "Full-featured calendar for Aura Agency System.",
};

export default function CalendarsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background">
      {children}
    </div>
  );
}
