import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'HWSI Dashboard',
  description: 'Heat-Water Stress Index Decision Support',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-screen w-screen overflow-hidden bg-gray-100 font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
