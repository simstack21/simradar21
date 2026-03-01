import type { FeatureLike } from "ol/Feature";
import Fill from "ol/style/Fill";
import Style from "ol/style/Style";
import Text from "ol/style/Text";

export type NavigraphStyleVars = {
	theme?: boolean;
	gateSize?: number;
};

export function getNavigraphGateStyle(vars?: NavigraphStyleVars) {
	const styleCache = new Map<string, Style>();

	const backgroundFill = vars?.theme ? new Fill({ color: "#1d1d1d" }) : new Fill({ color: "#f5f5f5" });
	const blockedFont = new Fill({ color: "#e54b4f" });
	const availableFont = new Fill({ color: "#2dbf7b" });

	return (feature: FeatureLike) => {
		const text = feature.get("label") as string;
		const blocked = feature.get("blocked") as boolean;

		const cacheKey = `${blocked}`;

		let style = styleCache.get(cacheKey);
		if (!style) {
			style = new Style({
				text: new Text({
					font: "400 11px Ubuntu, sans-serif",
					fill: blocked ? blockedFont : availableFont,
					backgroundFill,
					padding: [3, 2, 1, 4],
					textAlign: "center",
				}),
				zIndex: blocked ? 1 : 0,
			});
			styleCache.set(cacheKey, style);
		}

		style.getText()?.setText(text);
		return style;
	};
}
