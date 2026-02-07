"use client";

import { CalendarClockIcon, ChevronDownIcon, DatabaseIcon, type LucideIcon, MapIcon, PlaneIcon, PlaneTakeoffIcon, SectionIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Fragment } from "react/jsx-runtime";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type PathItem = {
	name: string;
	icon?: LucideIcon;
	href: string;
	children?: PathItem[];
};

const paths: PathItem[] = [
	{
		name: "Map",
		icon: MapIcon,
		href: "/",
		children: [
			{
				name: "Data",
				icon: DatabaseIcon,
				href: "/data",
				children: [
					{
						name: "Flights",
						icon: PlaneTakeoffIcon,
						href: "/data/flights",
					},
					{
						name: "Aircrafts",
						icon: PlaneIcon,
						href: "/data/aircrafts",
					},
				],
			},
			{
				name: "Bookings",
				icon: CalendarClockIcon,
				href: "/bookings",
			},
			{
				name: "Policy",
				icon: SectionIcon,
				href: "/policy",
			},
		],
	},
];

function findPathTrail(nodes: PathItem[], pathname: string, trail: PathItem[] = []): PathItem[] | null {
	for (const node of nodes) {
		const nextTrail = [...trail, node];

		if (node.href === pathname) return nextTrail;

		if (node.children) {
			const found = findPathTrail(node.children, pathname, nextTrail);
			if (found) return found;
		}
	}
	return null;
}

export const BreadCrumbWithDropdown = () => {
	const pathname = usePathname();
	const router = useRouter();

	const trail = findPathTrail(paths, pathname) ?? [];

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{trail.map((item, index) => {
					const isLast = index === trail.length - 1;
					const hasChildren = item.children?.length;

					return (
						<Fragment key={item.href}>
							<BreadcrumbItem>
								{isLast && hasChildren ? (
									<DropdownMenu>
										<DropdownMenuTrigger>
											<Badge className="gap-1">
												{item.icon && <item.icon data-icon="inline-start" />}
												{item.name}
												<ChevronDownIcon className="size-3" />
											</Badge>
										</DropdownMenuTrigger>

										<DropdownMenuContent align="start">
											{item.children?.map((child) => (
												<DropdownMenuItem key={child.href} onClick={() => router.push(child.href)}>
													{child.icon && <child.icon className="size-3 mr-2" />}
													{child.name}
												</DropdownMenuItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
								) : isLast ? (
									<BreadcrumbPage>
										<Badge className="gap-1">
											{item.icon && <item.icon data-icon="inline-start" />}
											{item.name}
										</Badge>
									</BreadcrumbPage>
								) : (
									<BreadcrumbLink href={item.href}>
										<Badge variant="outline" className="gap-1">
											{item.icon && <item.icon data-icon="inline-start" />}
											{item.name}
										</Badge>
									</BreadcrumbLink>
								)}
							</BreadcrumbItem>

							{!isLast && <BreadcrumbSeparator />}
						</Fragment>
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
};
