import { toast } from "sonner";
import { dxClearDatabase } from "@/storage/dexie";

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
			onClick: async () => {
				const repeat = localStorage.getItem("simradar21-reload-on-error");
				const repatCount = repeat ? Number(repeat) + 1 : 0;
				localStorage.setItem("simradar21-reload-on-error", repatCount.toString());

				if (repatCount < 2) {
					window.location.reload();
					return;
				}

				await dxClearDatabase();
				localStorage.clear();
				window.location.reload();
			},
		},
		duration: Infinity,
	});
