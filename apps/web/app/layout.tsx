import type { Metadata, Viewport } from "next";
import { Ubuntu } from "next/font/google";
import "./globals.css";
import "@/assets/images/sprites/freakflags.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
	title: "Simradar21",
	description: "Explore VATSIM network activities, live pilots, controllers or review past flights with our comprehensive tracking service.",
};

export const viewport: Viewport = {
	userScalable: false,
	minimumScale: 1,
	maximumScale: 1,
	width: "device-width",
};

const ubuntu = Ubuntu({
	subsets: ["latin"],
	weight: ["300", "400", "500", "700"],
	display: "swap",
});

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={ubuntu.className} suppressHydrationWarning>
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
