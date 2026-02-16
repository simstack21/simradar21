import { toast } from "sonner";

export const reloadOnErrorSonner = () =>
	toast.error("Oops! Something went wrong.", {
		description: "Try reloading the page. If the problem persists, please report the issue.",
		style: {
			"--normal-bg": "var(--destructive)",
			"--normal-text": "white",
			"--normal-border": "var(--border)",
			"--normal-outline": "var(--outline)",
		} as React.CSSProperties,
		action: {
			label: "Reload",
			onClick: () => window.location.reload(),
		},
		duration: Infinity,
	});
