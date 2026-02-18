import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "cdn.shadcnstudio.com",
			},
		],
	},
	reactStrictMode: false,
};

export default nextConfig;
