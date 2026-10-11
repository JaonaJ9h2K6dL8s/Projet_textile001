import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import ThemeRegistry from '@/components/theme/theme-registry';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'JO Management',
    template: '%s — JO Management',
  },
  description: "Gestion intégrée de l'entreprise",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
