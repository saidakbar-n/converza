import type {Metadata} from 'next';
import { Space_Grotesk, DM_Serif_Display, Space_Mono } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'], 
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans' 
});

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-serif',
  style: ['normal', 'italic']
});

const spaceMono = Space_Mono({ 
  subsets: ['latin'], 
  weight: ['400', '700'],
  variable: '--font-mono' 
});

export const metadata: Metadata = {
  title: 'Converza | Autonomous Marketing Swarm',
  description: 'An autonomous 19-node AI workforce that replaces $5,000/m e-commerce marketing agencies.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${dmSerif.variable} ${spaceMono.variable} scroll-smooth`}>
      <body className="antialiased selection:bg-accent selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}