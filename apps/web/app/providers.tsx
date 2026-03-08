"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { UpdateModal } from "@/components/shared/UpdateModal";
import { Toaster } from "@/components/ui/sonner";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			<SessionProvider basePath="/auth">
				<Toaster position="top-right" />
				<UpdateModal />
				<ThemeProvider>{children}</ThemeProvider>
			</SessionProvider>
		</QueryClientProvider>
	);
}
