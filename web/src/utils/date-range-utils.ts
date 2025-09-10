import { type DateRange } from "react-day-picker";
import { z } from "zod/v4";
import { addMinutes } from "date-fns";
import { type DateTrunc } from "@langfuse/shared/src/server";

export const DEFAULT_DASHBOARD_AGGREGATION_SELECTION = "Past 1 day" as const;
export const DASHBOARD_AGGREGATION_PLACEHOLDER = "Custom" as const;

export const DASHBOARD_AGGREGATION_OPTIONS = [
  "Past 5 min",
  "Past 30 min",
  "Past 1 hour",
  "Past 3 hours",
  "Past 1 day",
  "Past 7 days",
  "Past 30 days",
  "Past 90 days",
  "Past 1 year",
] as const;

export const TABLE_AGGREGATION_OPTIONS = [
  "Past 30 min",
  "Past 1 hour",
  "Past 6 hours",
  "Past 1 day",
  "Past 3 days",
  "Past 7 days",
  "Past 14 days",
  "Past 30 days",
  "Past 90 days",
  "All time",
] as const;

export type DashboardDateRangeAggregationOption =
  (typeof DASHBOARD_AGGREGATION_OPTIONS)[number];

export type TableDateRange = {
  from: Date;
};

export type TableDateRangeAggregationOption =
  (typeof TABLE_AGGREGATION_OPTIONS)[number];

export type DashboardDateRange = {
  from: Date;
  to: Date;
};

export type DateRangeAggregationOption =
  | DashboardDateRangeAggregationOption
  | TableDateRangeAggregationOption;

export type DashboardDateRangeOptions =
  | DashboardDateRangeAggregationOption
  | typeof DASHBOARD_AGGREGATION_PLACEHOLDER;

export type TableDateRangeOptions = TableDateRangeAggregationOption;
export type DashboardDateRangeAggregationSettings = Record<
  DashboardDateRangeAggregationOption,
  {
    date_trunc: DateTrunc;
    minutes: number;
  }
>;

export const dateTimeAggregationOptions = [
  ...TABLE_AGGREGATION_OPTIONS,
  ...DASHBOARD_AGGREGATION_OPTIONS,
] as const;

export const dashboardDateRangeAggregationSettings: DashboardDateRangeAggregationSettings =
  {
    "Past 1 year": {
      date_trunc: "month",
      minutes: 365 * 24 * 60,
    },
    "Past 90 days": {
      date_trunc: "week",
      minutes: 90 * 24 * 60,
    },
    "Past 30 days": {
      date_trunc: "day",
      minutes: 30 * 24 * 60,
    },
    "Past 7 days": {
      date_trunc: "hour",
      minutes: 7 * 24 * 60,
    },
    "Past 1 day": {
      date_trunc: "hour",
      minutes: 24 * 60,
    },
    "Past 3 hours": {
      date_trunc: "minute",
      minutes: 3 * 60,
    },
    "Past 1 hour": {
      date_trunc: "minute",
      minutes: 60,
    },
    "Past 30 min": {
      date_trunc: "minute",
      minutes: 30,
    },
    "Past 5 min": {
      date_trunc: "minute",
      minutes: 5,
    },
  };

export const SelectedTimeOptionSchema = z
  .discriminatedUnion("filterSource", [
    z.object({
      filterSource: z.literal("TABLE"),
      option: z.enum(TABLE_AGGREGATION_OPTIONS),
    }),
    z.object({
      filterSource: z.literal("DASHBOARD"),
      option: z.enum(DASHBOARD_AGGREGATION_OPTIONS),
    }),
  ])
  .optional();

export const isDashboardDateRangeOptionAvailable = ({
  option,
  limitDays,
}: {
  option: DashboardDateRangeAggregationOption;
  limitDays: number | false;
}) => {
  if (limitDays === false) return true;

  const { minutes } = dashboardDateRangeAggregationSettings[option];
  return limitDays >= minutes / (24 * 60);
};

type SelectedTimeOption = z.infer<typeof SelectedTimeOptionSchema>;

const TABLE_DATE_RANGE_AGGREGATION_SETTINGS = new Map<
  TableDateRangeAggregationOption,
  number | null
>([
  ["Past 90 days", 90 * 24 * 60],
  ["Past 30 days", 30 * 24 * 60],
  ["Past 14 days", 14 * 24 * 60],
  ["Past 7 days", 7 * 24 * 60],
  ["Past 3 days", 3 * 24 * 60],
  ["Past 1 day", 24 * 60],
  ["Past 6 hours", 6 * 60],
  ["Past 1 hour", 60],
  ["Past 30 min", 30],
  ["All time", null],
]);

export const isTableDataRangeOptionAvailable = ({
  option,
  limitDays,
}: {
  option: TableDateRangeAggregationOption;
  limitDays: number | false;
}) => {
  if (limitDays === false) return true;

  const durationMinutes = TABLE_DATE_RANGE_AGGREGATION_SETTINGS.get(option);
  if (!durationMinutes) return false;

  return limitDays >= durationMinutes / (24 * 60);
};

export const getDateFromOption = (
  selectedTimeOption: SelectedTimeOption,
): Date | undefined => {
  if (!selectedTimeOption) return undefined;

  const { filterSource, option } = selectedTimeOption;
  if (filterSource === "TABLE") {
    const setting = TABLE_DATE_RANGE_AGGREGATION_SETTINGS.get(option);
    if (!setting) return undefined;

    return addMinutes(new Date(), -setting);
  } else if (filterSource === "DASHBOARD") {
    const setting =
      dashboardDateRangeAggregationSettings[
        option as keyof typeof dashboardDateRangeAggregationSettings
      ];

    return addMinutes(new Date(), -setting.minutes);
  }
  return undefined;
};

export function isValidDashboardDateRangeAggregationOption(
  value?: string,
): value is DashboardDateRangeAggregationOption {
  if (!value) return false;
  return (DASHBOARD_AGGREGATION_OPTIONS as readonly string[]).includes(value);
}

export function isValidTableDateRangeAggregationOption(
  value?: string,
): value is TableDateRangeAggregationOption {
  if (!value) return false;
  return (TABLE_AGGREGATION_OPTIONS as readonly string[]).includes(value);
}

// Function to convert time range options to abbreviated format
export function getAbbreviatedTimeRange(
  option: DateRangeAggregationOption,
): string {
  // Handle both old and new formats for backward compatibility
  const cleanOption = option.replace(/^Past /, "");

  const abbreviationMap: Record<string, string> = {
    "5 min": "5m",
    "30 min": "30m",
    "1 hour": "1h",
    "3 hours": "3h",
    "6 hours": "6h",
    "1 day": "1d",
    "3 days": "3d",
    "7 days": "7d",
    "14 days": "14d",
    "30 days": "30d",
    "90 days": "90d",
    "1 year": "1y",
    "All time": "All",
    Custom: "Custom",
  };

  return abbreviationMap[cleanOption] || abbreviationMap[option] || option;
}

export const findClosestDashboardInterval = (
  dateRange: DateRange,
): DashboardDateRangeAggregationOption | undefined => {
  if (!dateRange.from || !dateRange.to) return undefined;
  const duration = dateRange.to.getTime() - dateRange.from.getTime();

  const diffs = DASHBOARD_AGGREGATION_OPTIONS.map((interval) => {
    const { minutes } = dashboardDateRangeAggregationSettings[interval];
    return {
      interval,
      diff: Math.abs(duration - minutes * 60 * 1000),
    };
  });

  diffs.sort((a, b) => a.diff - b.diff);

  return diffs[0]?.interval;
};
