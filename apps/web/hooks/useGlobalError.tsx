"use client";

import { useEffect } from "react";
import { reloadOnErrorSonner } from "@/components/shared/Sonner";

export default function useGlobalError() {
	useEffect(() => {
		const handleError = (event: ErrorEvent) => {
			console.error("Uncaught error:", event.error);
			reloadOnErrorSonner();
		};
		const handleRejection = (event: PromiseRejectionEvent) => {
			console.error("Unhandled rejection:", event.reason);
			reloadOnErrorSonner();
		};

		window.addEventListener("error", handleError);
		window.addEventListener("unhandledrejection", handleRejection);

		return () => {
			window.removeEventListener("error", handleError);
			window.removeEventListener("unhandledrejection", handleRejection);
		};
	}, []);

	return null;
}
