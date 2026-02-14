import { MinusIcon } from "lucide-react";
import { Fragment, useId, useState } from "react";
import { FILTER_BY_KEY } from "@/app/(map)/lib/filter";
import { Button } from "@/components/ui/button";
import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxContent,
	ComboboxItem,
	ComboboxList,
	ComboboxValue,
	useComboboxAnchor,
} from "@/components/ui/combobox";
import { Slider } from "@/components/ui/slider";
import { useFiltersStore } from "@/storage/zustand";
import type { FilterDefinition } from "@/types/zustand";

export default function FilterInput() {
	const { activeFilters } = useFiltersStore();

	if (activeFilters.length === 0) return null;

	return (
		<div className="p-2 bg-muted/50 flex flex-col gap-2">
			{activeFilters.map((key) => {
				const filter = FILTER_BY_KEY[key];
				if (!filter) return null;

				if (filter.input === "range") {
					return <RangeFilter key={key} filter={filter} />;
				}
				if (filter.input === "select") {
					return <MultiSelectFilter key={key} filter={filter} />;
				}
				return null;
			})}
		</div>
	);
}

function MultiSelectFilter({ filter }: { filter: FilterDefinition }) {
	const id = useId();
	const anchor = useComboboxAnchor();

	const { setFilterValue, removeFilter, ...filters } = useFiltersStore();

	const [inputValue, setInputValue] = useState("");
	const [options, setOptions] = useState(filter.options instanceof Function ? [] : filter.options || []);

	const normalized = (v: string) => (filter.uppercase ? v.toUpperCase() : v);

	const onInputChange = (value: string) => {
		setInputValue(value);
		if (filter.options instanceof Function) {
			filter.options(value).then(setOptions);
		}
	};

	return (
		<div className="flex flex-col gap-0.5">
			<span className="text-xs ml-1">{filter.label}</span>
			<div className="flex gap-1">
				<Combobox
					id={id}
					multiple
					autoHighlight
					onInputValueChange={onInputChange}
					onOpenChange={(open) => (open ? onInputChange("") : undefined)}
					value={filters[filter.key] as string[]}
					onValueChange={(values) => setFilterValue(filter.key, values as string[])}
				>
					<ComboboxChips ref={anchor} className="w-full max-w-xs">
						<ComboboxValue>
							{(values) => (
								<Fragment>
									{values.map((value: string) => (
										<ComboboxChip key={value}>{normalized(value)}</ComboboxChip>
									))}
									<ComboboxChipsInput placeholder={values.length > 0 ? "" : filter.description} />
								</Fragment>
							)}
						</ComboboxValue>
					</ComboboxChips>
					<ComboboxContent anchor={anchor}>
						<ComboboxList>
							{options.map((option) => (
								<ComboboxItem key={option.value} value={option.value}>
									{filter.extendedOptions ? `${option.value} - ${option.label}` : normalized(option.label)}
								</ComboboxItem>
							))}
							{(filter.options instanceof Function || filter.options?.length === 0) && options.length === 0 && (
								<ComboboxItem value={inputValue}>{normalized(inputValue)}</ComboboxItem>
							)}
						</ComboboxList>
					</ComboboxContent>
				</Combobox>
				<Button variant="outline" size="icon" onClick={() => removeFilter(filter.key)}>
					<MinusIcon />
				</Button>
			</div>
		</div>
	);
}

function RangeFilter({ filter }: { filter: FilterDefinition }) {
	const { setFilterValue, removeFilter, ...filters } = useFiltersStore();

	return (
		<div className="flex items-center gap-1">
			<div className="flex flex-col w-full gap-2 px-1 pb-1">
				<div className="flex justify-between">
					<span className="text-xs">{filter.label}</span>
					<span className="text-xs text-muted-foreground ml-auto">{(filters[filter.key] as [number, number]).join(", ")}</span>
				</div>
				<Slider
					value={filters[filter.key] as [number, number]}
					onValueChange={(value) => setFilterValue(filter.key, value as [number, number])}
					min={filter.min}
					max={filter.max}
				/>
			</div>
			<Button variant="outline" size="icon" onClick={() => removeFilter(filter.key)}>
				<MinusIcon />
			</Button>
		</div>
	);
}
