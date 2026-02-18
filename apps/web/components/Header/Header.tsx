"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import simradar21Full from "@/assets/images/logos/simradar21_full_logo.svg";
import simradar21Icon from "@/assets/images/logos/simradar21_icon.svg";
import useGlobalError from "@/hooks/useGlobalError";
import useInitializer from "@/hooks/useInitializer";
import useSettings from "@/hooks/useSettings";
import { CommandSearch } from "../Search/Search";
import DialogSettings from "../Settings/Settings";
import { DropdownNavigation, DropdownUser } from "../shared/Dropdown";
import { SwitchTheme, SwitchTimeZone } from "../shared/Switch";

export default function Header() {
	const [open, setOpen] = useState(false);
	const headerRef = useRef<HTMLElement>(null);

	useSettings();
	useInitializer();
	useGlobalError();

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
				setOpen(false);
			}
		}

		if (open) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [open]);

	return (
		<header
			ref={headerRef}
			className="fixed top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-2 rounded-full overflow-hidden h-10 glass-panel min-w-max"
		>
			<figure className="bg-blue h-full flex items-center px-4 shrink-0">
				<a href="/">
					<Image src={simradar21Icon} alt="simradar21 logo" height={18} className="block sm:hidden" priority />
					<Image src={simradar21Full} alt="simradar21 full logo" height={18} className="hidden sm:block" priority />
				</a>
			</figure>
			<CommandSearch />
			<DialogSettings />
			<DropdownNavigation />
			<SwitchTheme />
			<SwitchTimeZone />
			<DropdownUser />
		</header>
	);
}
