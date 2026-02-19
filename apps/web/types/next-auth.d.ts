import "next-auth";

declare module "next-auth" {
	interface Session {
		vatsim?: {
			cid: number;
			name: string;
		};
		hasNavigraph?: boolean;
	}

	interface Profile {
		data?: {
			cid: number;
			personal: {
				name_full: string;
			};
		};
		sub?: string;
		name?: string;
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		vatsim?: {
			cid: number;
			name: string;
		};
		hasNavigraph?: boolean;
	}
}
