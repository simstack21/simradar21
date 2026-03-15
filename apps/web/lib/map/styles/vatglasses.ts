import type { FeatureLike } from "ol/Feature";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";

export function getVatglassesStyle() {
	const styleCache = new Map<string, Style>();

	const defaultStyle = new Style({
		fill: new Fill({ color: `#00000033` }),
		stroke: new Stroke({ color: "#000000" }),
	});

	return (feature: FeatureLike) => {
		const color = feature.get("color") as string | null;
		if (!color) return defaultStyle;

		const active = !!(feature.get("clicked") || feature.get("hovered"));

		const cacheKey = `${color}_${active}`;
		if (styleCache.has(cacheKey)) return styleCache.get(cacheKey);

		const style = new Style({
			fill: new Fill({ color: active ? `${color}66` : `${color}33` }),
			stroke: new Stroke({ color }),
		});
		styleCache.set(cacheKey, style);

		return style;
	};
}
