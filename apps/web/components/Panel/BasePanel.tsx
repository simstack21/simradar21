"use client";

import "./BasePanel.css";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { useFiltersStore } from "@/storage/zustand";

export default function BasePanel({ children }: { children: React.ReactNode }) {
	const _pathname = usePathname();

	const [open, _setOpen] = useState(true);

	const _prevPath = useRef<string | null>(null);

	// const { isHidden } = useMapVisibilityStore();
	const { active } = useFiltersStore();

	// useEffect(() => {
	// 	const type = pathname.split("/")[1] || "";

	// 	if (prevPath.current === null && !isHidden) {
	// 		prevPath.current = type;
	// 		return;
	// 	}

	// 	let openTimeout: NodeJS.Timeout | undefined;
	// 	let isAnimated = false;

	// 	if (prevPath.current !== type && !isHidden) {
	// 		isAnimated = true;
	// 		setOpen(false);
	// 	}

	// 	if (prevPath.current !== type) {
	// 		setOpen(false);
	// 		openTimeout = setTimeout(() => setOpen(type === "" ? !isHidden : true), 300);
	// 	}

	// 	prevPath.current = type;

	// 	return () => {
	// 		clearTimeout(openTimeout);
	// 	};
	// }, [pathname, isHidden]);

	return (
		<div className={`panel-wrapper${open ? "" : " hide"}`} style={{ maxHeight: `calc(100% - ${active ? 9.5 : 7}rem)` }}>
			{children}
		</div>
	);
}
