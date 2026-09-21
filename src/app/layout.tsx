import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mafia Online - Social Deduction Game',
  description: 'Play the classic Mafia party game online with friends. Create rooms, assign roles, and find the imposters!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="starfield" />
        <main className="relative z-10 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
