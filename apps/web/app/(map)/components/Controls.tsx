"use client";

import { usePathname, useRouter } from "next/navigation";
import "./Controls.css";
import { useState } from "react";
import Icon from "@/components/Icon/Icon";
import { useFiltersStore, useMapRotationStore, useMapVisibilityStore } from "@/storage/zustand";
import { mapService } from "../lib";
import { ToggleSwitch } from "@/components/Input/Input";

export default function Controls() {
	const router = useRouter();
	const pathname = usePathname();

	const [isFullscreen, setIsFullscreen] = useState(false);

	const { active: filterActive } = useFiltersStore();
	const { isHidden, setHidden } = useMapVisibilityStore();
	const { rotation, setRotation } = useMapRotationStore();

	const isMultiView = pathname.startsWith("/multi");

	const onFullscreen = async () => {
		try {
			if (!isFullscreen) {
				await document.documentElement.requestFullscreen();
				setIsFullscreen(true);
			} else {
				await document.exitFullscreen();
				setIsFullscreen(false);
			}
		} catch (err) {
			console.error("Fullscreen error:", err);
		}
	};

	const onCenterOnLocation = () => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					mapService.setView({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 12 });
				},
				(err) => {
					console.error("Geolocation error:", err);
				},
			);
		} else {
			alert("Geolocation is not supported by your browser.");
		}
	};

	return (
		<>
			<div id="map-controls-upper">
				<div className="map-control-item upper">
					<p>Multi View</p>
					<ToggleSwitch checked={isMultiView} onChange={(e) => router.push(e.target.checked ? "/multi" : "/")} />
				</div>
				<div className="map-control-item upper">
					<Icon name={isHidden ? "eye-crossed" : "eye"} size={22} />
					<ToggleSwitch checked={isHidden} onChange={(e) => setHidden(e.target.checked)} />
				</div>
			</div>
			<div id="map-controls" className={isHidden ? "hidden" : ""}>
				<button type="button" className="map-control-item" onClick={onFullscreen}>
					<Icon name={isFullscreen ? "resize-decrease" : "resize-increase"} size={22} />
				</button>
				<button type="button" className="map-control-item" onClick={() => mapService.setView({ zoomStep: 1 })}>
					<Icon name="add" />
				</button>
				<button type="button" className="map-control-item" onClick={() => mapService.setView({ zoomStep: -1 })}>
					<Icon name="remove" />
				</button>
				<button type="button" className="map-control-item" onClick={onCenterOnLocation}>
					<Icon name="poi-contact" size={22} />
				</button>
				<button
					type="button"
					className="map-control-item"
					onClick={() => {
						mapService.setView({ rotation: 0 });
						setRotation(0);
					}}
				>
					<Icon name="compass" size={22} style={{ transform: `rotate(${rotation - 0.4}rad)` }} />
				</button>
				<button type="button" className={`map-control-item ${filterActive ? "active" : ""}`} onClick={() => router.push("/filters")}>
					<Icon name="filter" size={22} />
				</button>
				<button type="button" className="map-control-item" onClick={() => router.push("/settings")}>
					<Icon name="settings" size={24} offset={1} />
				</button>
			</div>
		</>
	);
}
