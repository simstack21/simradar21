import Image from "next/image";
import Link from "next/link";
import simradar21Full from "@/assets/images/logos/simradar21_full_logo.svg";
import { Button } from "@/components/ui/button";

export function Placeholder({ text }: { text: string }) {
	return (
		<div className="flex flex-col justify-center items-center grow gap-6">
			<Image src={simradar21Full} alt="simradar21 full logo" width={300} priority className="" />
			<div className="font-bold text-2xl text-center">Work in progress... Stay tuned!</div>
			<div className="text-center max-w-3xl">{text}</div>
			<Link href="https://discord.gg/eVvKBfUr" target="_blank" rel="noopener noreferrer">
				<Button
					size="lg"
					className="bg-transparent bg-linear-to-r from-primary via-primary/10 to-primary bg-size-[200%_auto] text-white hover:bg-transparent hover:bg-position-[99%_center] focus-visible:ring-primary/40 dark:from-primary dark:via-primary/70 dark:to-primary dark:focus-visible:ring-primary/60"
				>
					Join our Discord{" "}
					<Image
						src={"https://cdn.shadcnstudio.com/ss-assets/brand-logo/discord-icon.png?width=40&height=40&format=auto"}
						alt="Discord Icon"
						width={16}
						height={16}
						className="filter brightness-0 invert ml-1"
					/>
				</Button>
			</Link>
		</div>
	);
}
