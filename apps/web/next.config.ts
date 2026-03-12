import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "cdn.shadcnstudio.com",
			},
			{
				protocol: "https",
				hostname: "t.plnspttrs.net",
			},
		],
	},
};

export default nextConfig;
