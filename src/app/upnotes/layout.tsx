import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UpNotes | Aura",
  description: "Your knowledge base in Aura.",
};

export default function UpNotesLayout({
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
