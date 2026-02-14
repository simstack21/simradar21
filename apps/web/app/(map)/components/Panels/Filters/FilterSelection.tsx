import { InfoIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { FILTER_CATEGORIES, FILTER_SUB_CATEGORIES } from "@/app/(map)/lib/filter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFiltersStore } from "@/storage/zustand";
import type { FilterDefinition } from "@/types/zustand";

export default function FilterSelection() {
	const [category, setCategory] = useState<string | null>(null);

	return (
		<div className="p-2 bg-muted/50 flex flex-col gap-2">
			<Alert>
				<InfoIcon />
				<AlertTitle>You have no saved presets yet</AlertTitle>
				<AlertDescription>
					Start by selecting a filter category from the dropdown below and then add one of the subcategories to the list of active filters.
				</AlertDescription>
			</Alert>
			<Select items={FILTER_CATEGORIES} value={category} onValueChange={setCategory}>
				<SelectTrigger className="w-full">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectLabel>Filter Category</SelectLabel>
						{FILTER_CATEGORIES.map((category) => (
							<SelectItem key={category.value} value={category.value}>
								{category.label}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
			{category && (
				<div className="flex flex-col gap-2">
					{FILTER_SUB_CATEGORIES[category].map((filter) => (
						<SubCategoryItem key={filter.key} filter={filter} />
					))}
				</div>
			)}
		</div>
	);
}

function SubCategoryItem({ filter }: { filter: FilterDefinition }) {
	const { addFilter, removeFilter, activeFilters } = useFiltersStore();
	const active = activeFilters.includes(filter.key);

	return (
		<Item variant="muted">
			<ItemContent>
				<ItemTitle>{filter.label}</ItemTitle>
				<ItemDescription>{filter.description}</ItemDescription>
			</ItemContent>
			<ItemActions>
				{active ? (
					<Button variant="outline" size="icon" onClick={() => removeFilter(filter.key)}>
						<MinusIcon />
					</Button>
				) : (
					<Button variant="outline" size="icon" onClick={() => addFilter(filter.key)}>
						<PlusIcon />
					</Button>
				)}
			</ItemActions>
		</Item>
	);
}
