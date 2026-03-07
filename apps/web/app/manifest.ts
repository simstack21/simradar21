import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "simradar21",
		short_name: "simradar21",
		description: "Explore VATSIM network activities, live pilots, controllers or review past flights.",
		start_url: "/",
		display: "standalone",
		background_color: "#000000",
		theme_color: "#000000",
		icons: [
			{
				src: "/icons/simstack21-192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				src: "/icons/simstack21-512.png",
				sizes: "512x512",
				type: "image/png",
			},
		],
	};
}
