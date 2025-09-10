import * as React from "react";
import { addMinutes } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

import {
  dashboardDateRangeAggregationSettings,
  DASHBOARD_AGGREGATION_PLACEHOLDER,
  type DashboardDateRangeOptions,
  type TableDateRangeOptions,
  DASHBOARD_AGGREGATION_OPTIONS,
  type DashboardDateRange,
  TABLE_AGGREGATION_OPTIONS,
  getDateFromOption,
  isTableDataRangeOptionAvailable,
  isDashboardDateRangeOptionAvailable,
  getAbbreviatedTimeRange,
} from "@/src/utils/date-range-utils";
import { useEntitlementLimit } from "@/src/features/entitlements/hooks";
import { useMemo } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/src/components/ui/hover-card";
import { HoverCardPortal } from "@radix-ui/react-hover-card";

type BaseDateRangeDropdownProps<T> = {
  selectedOption: T;
  options: readonly T[];
  limitedOptions?: readonly T[];
  onSelectionChange: (value: T) => void;
};

const BaseDateRangeDropdown = <T extends string>({
  selectedOption,
  options,
  limitedOptions,
  onSelectionChange,
}: BaseDateRangeDropdownProps<T>) => {
  return (
    <Select value={selectedOption} onValueChange={onSelectionChange}>
      <SelectTrigger className="w-fit font-medium hover:bg-accent hover:text-accent-foreground focus:ring-0 focus:ring-offset-0">
        <SelectValue placeholder="Select" />
      </SelectTrigger>
      <SelectContent position="popper" defaultValue={60}>
        {options.map((item) => {
          const itemObj = (
            <SelectItem
              key={item}
              value={item}
              disabled={limitedOptions?.includes(item)}
            >
              {item}
            </SelectItem>
          );
          const isLimited = limitedOptions?.includes(item);

          return isLimited ? (
            <HoverCard openDelay={200}>
              <HoverCardTrigger asChild>
                <span>{itemObj}</span>
              </HoverCardTrigger>
              <HoverCardPortal>
                <HoverCardContent className="w-60 text-sm" side="right">
                  This time range is not available in your current plan.
                </HoverCardContent>
              </HoverCardPortal>
            </HoverCard>
          ) : (
            itemObj
          );
        })}
      </SelectContent>
    </Select>
  );
};

type DashboardDateRangeDropdownProps = {
  selectedOption: DashboardDateRangeOptions;
  setDateRangeAndOption: (
    option: DashboardDateRangeOptions,
    date?: DashboardDateRange,
  ) => void;
};

export const DashboardDateRangeDropdown: React.FC<
  DashboardDateRangeDropdownProps
> = ({ selectedOption, setDateRangeAndOption }) => {
  const lookbackLimit = useEntitlementLimit("data-access-days");
  const disabledOptions = useMemo(() => {
    return DASHBOARD_AGGREGATION_OPTIONS.filter(
      (option) =>
        !isDashboardDateRangeOptionAvailable({
          option,
          limitDays: lookbackLimit,
        }),
    );
  }, [lookbackLimit]);

  const onDropDownSelection = (value: DashboardDateRangeOptions) => {
    if (value === DASHBOARD_AGGREGATION_PLACEHOLDER) {
      setDateRangeAndOption(DASHBOARD_AGGREGATION_PLACEHOLDER, undefined);
      return;
    }
    const setting =
      dashboardDateRangeAggregationSettings[
        value as keyof typeof dashboardDateRangeAggregationSettings
      ];
    setDateRangeAndOption(value, {
      from: addMinutes(new Date(), -setting.minutes),
      to: new Date(),
    });
  };

  const options =
    selectedOption === DASHBOARD_AGGREGATION_PLACEHOLDER
      ? [...DASHBOARD_AGGREGATION_OPTIONS, DASHBOARD_AGGREGATION_PLACEHOLDER]
      : [...DASHBOARD_AGGREGATION_OPTIONS];
  return (
    <BaseDateRangeDropdown
      selectedOption={selectedOption}
      options={options}
      limitedOptions={disabledOptions}
      onSelectionChange={onDropDownSelection}
    />
  );
};

type TableDateRangeDropdownProps = {
  selectedOption: TableDateRangeOptions;
  setDateRangeAndOption: (
    option: TableDateRangeOptions,
    date?: DashboardDateRange,
  ) => void;
};

export const TableDateRangeDropdown: React.FC<TableDateRangeDropdownProps> = ({
  selectedOption,
  setDateRangeAndOption,
}) => {
  const lookbackLimit = useEntitlementLimit("data-access-days");
  const disabledOptions = useMemo(() => {
    return TABLE_AGGREGATION_OPTIONS.filter(
      (option) =>
        !isTableDataRangeOptionAvailable({ option, limitDays: lookbackLimit }),
    );
  }, [lookbackLimit]);

  const onDropDownSelection = (value: TableDateRangeOptions) => {
    const dateFromOption = getDateFromOption({
      filterSource: "TABLE",
      option: value,
    });

    const initialDateRange = !!dateFromOption
      ? { from: dateFromOption, to: new Date() }
      : undefined;

    setDateRangeAndOption(value, initialDateRange);
  };

  return (
    <Select value={selectedOption} onValueChange={onDropDownSelection}>
      <SelectTrigger className="w-fit font-medium hover:bg-accent hover:text-accent-foreground focus:ring-0 focus:ring-offset-0">
        <SelectValue placeholder="Select">
          <div className="flex items-center gap-2">
            <span className="w-10 rounded bg-muted px-1.5 py-0.5 text-center text-xs">
              {getAbbreviatedTimeRange(selectedOption as any)}
            </span>
            <span>{selectedOption}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent position="popper" defaultValue={60}>
        {TABLE_AGGREGATION_OPTIONS.map((item) => {
          const itemObj = (
            <div
              key={item}
              className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              onClick={() =>
                !disabledOptions?.includes(item) && onDropDownSelection(item)
              }
            >
              <div className="flex items-center gap-2">
                <span className="w-10 rounded bg-muted px-1.5 py-0.5 text-center text-xs">
                  {getAbbreviatedTimeRange(item as any)}
                </span>
                <span>{item}</span>
              </div>
            </div>
          );
          const isLimited = disabledOptions?.includes(item);

          return isLimited ? (
            <HoverCard openDelay={200} key={item}>
              <HoverCardTrigger asChild>
                <span>{itemObj}</span>
              </HoverCardTrigger>
              <HoverCardPortal>
                <HoverCardContent className="w-60 text-sm" side="right">
                  This time range is not available in your current plan.
                </HoverCardContent>
              </HoverCardPortal>
            </HoverCard>
          ) : (
            itemObj
          );
        })}
      </SelectContent>
    </Select>
  );
};
