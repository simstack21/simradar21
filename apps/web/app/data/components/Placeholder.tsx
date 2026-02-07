import Image from "next/image";
import "./Placeholder.css";
import simradar21Full from "@/assets/images/logos/simradar21_full_logo.svg";

export function Placeholder({ text }: { text: string }) {
	return (
		<div id="placeholder">
			<Image src={simradar21Full} alt="simradar21 full logo" width={300} priority />
			<div id="placeholder-title">Work in progress ... Stay tuned!</div>
			<div id="placeholder-text">{text}</div>
		</div>
	);
}
