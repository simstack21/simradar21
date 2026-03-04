import type { NavigraphWaypoint } from "@sr24/types/navigraph";
import type { FeatureLike } from "ol/Feature";
import Fill from "ol/style/Fill";
import Icon from "ol/style/Icon";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";
import Text from "ol/style/Text";
import sprite from "@/assets/images/sprites/waypoints.png";

export type NavigraphStyleVars = {
	theme?: boolean;
	gateSize?: number;
	waypointSize?: number;
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

const ICON_SIZE = 24;

export function getNavigraphRoutePointStyle(vars?: NavigraphStyleVars) {
	const styleCache = new Map<string, Style>();
	const fill = vars?.theme ? new Fill({ color: "rgba(255, 255, 255, 0.5)" }) : new Fill({ color: "rgba(0, 0, 0, 0.5)" });
	const xOffset = vars?.theme ? ICON_SIZE : 0;

	return (feature: FeatureLike) => {
		const type = feature.get("class") as NavigraphWaypoint["class"];
		const text = feature.get("label") as string;
		const scale = Math.round(((vars?.waypointSize || 50) / 100) * 100) / 100;

		const cacheKey = type;

		let style = styleCache.get(cacheKey);
		if (!style) {
			const offset = [xOffset, getWaypointOffset(type)];
			style = new Style({
				image: new Icon({
					src: sprite.src,
					size: [ICON_SIZE, ICON_SIZE],
					offset,
					scale,
					rotateWithView: false,
				}),
				text: new Text({
					font: "400 10px Ubuntu, sans-serif",
					fill: fill,
					offsetY: scale * 30,
					textAlign: "center",
					declutterMode: "declutter",
				}),
			});
			styleCache.set(cacheKey, style);
		}

		style.getText()?.setText(text);
		return style;
	};
}

function getWaypointOffset(type: NavigraphWaypoint["class"]): number {
	switch (type) {
		case "VOR":
			return 0;
		case "DME":
			return ICON_SIZE;
		case "VORDME":
			return ICON_SIZE * 2;
		case "TACAN":
			return ICON_SIZE * 3;
		case "NDB":
			return ICON_SIZE * 4;
		case "INT":
			return ICON_SIZE * 5;
		case "WPT":
			return ICON_SIZE * 6;
		default:
			return 0;
	}
}

export function getNavigraphRouteTrackStyle(vars?: NavigraphStyleVars) {
	const styleCache = new Map<string, Style>();
	const defaultStroke = new Stroke({
		color: "rgba(0, 123, 255, 0.3)",
		width: 3,
	});
	const sidStroke = new Stroke({
		color: "rgba(210, 75, 142, 0.7)",
		width: 3,
	});
	const starStroke = new Stroke({
		color: "rgba(117, 161, 89, 0.7)",
		width: 3,
	});
	const fill = vars?.theme ? new Fill({ color: "rgba(255, 255, 255, 0.5)" }) : new Fill({ color: "rgba(0, 0, 0, 0.5)" });

	return (feature: FeatureLike) => {
		const text = feature.get("label") as string | undefined;
		const type = feature.get("type") as "sid" | "star" | undefined;

		const cacheKey = `${type}`;
		let style = styleCache.get(cacheKey);
		if (!style) {
			style = new Style({
				stroke: type === "sid" ? sidStroke : type === "star" ? starStroke : defaultStroke,
				text: new Text({
					font: "400 10px Ubuntu, sans-serif",
					fill: fill,
					placement: "line",
				}),
			});
			styleCache.set(cacheKey, style);
		}

		style.getText()?.setText(text);
		return style;
	};
}
