export function setHeight(ref: React.RefObject<HTMLDivElement | null>, isOpen: boolean) {
	if (!ref.current) return;

	if (isOpen) {
		ref.current.style.minHeight = `${ref.current.scrollHeight}px`;
	} else {
		ref.current.style.minHeight = "0px";
	}
}

export function getSpriteOffset(status: string | undefined) {
	switch (status) {
		case "Climb":
			return -30;
		case "Cruise":
			return -60;
		case "Descent":
			return -90;
		default:
			return 0;
	}
}

export function getDelayColorFromDates(scheduled: number | undefined, actual: number | undefined): "green" | "yellow" | "red" | null {
	if (!scheduled || !actual) return null;

	const delayMinutes = (actual - scheduled) / 60000;
	if (delayMinutes >= 30) {
		return "red";
	} else if (delayMinutes >= 15) {
		return "yellow";
	} else if (delayMinutes > 0) {
		return "green";
	}
	return "green";
}

export function getDelayColorFromNumber(avgDelay: number): "green" | "yellow" | "red" | null {
	if (avgDelay >= 60) {
		return "red";
	} else if (avgDelay >= 30) {
		return "yellow";
	} else if (avgDelay > 0) {
		return "green";
	}
	return "green";
}
