import type { EventDisplayStatus } from "@/lib/constants/event";

export const EVENT_LIST_PATH = "/admin/events";

export type EventListUrlFilters = {
  keyword: string;
  statuses: EventDisplayStatus[];
  eventTypeCodes: string[];
  page: number;
};

const EVENT_DISPLAY_STATUSES = new Set<EventDisplayStatus>([
  "receiving",
  "paused",
  "waiting",
  "closed",
]);

export function defaultEventListUrlFilters(): EventListUrlFilters {
  return {
    keyword: "",
    statuses: [],
    eventTypeCodes: [],
    page: 1,
  };
}

function parseCommaSeparatedEnums<T extends string>(
  value: string | null,
  valid: Set<T>
): T[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part): part is T => valid.has(part as T));
}

function parseCommaSeparatedStrings(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function parseEventListSearchParams(
  searchParams: URLSearchParams
): EventListUrlFilters {
  const pageRaw = parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;

  return {
    keyword: searchParams.get("keyword") ?? "",
    statuses: parseCommaSeparatedEnums(
      searchParams.get("statuses"),
      EVENT_DISPLAY_STATUSES
    ),
    eventTypeCodes: parseCommaSeparatedStrings(searchParams.get("eventTypes")),
    page,
  };
}

export function buildEventListSearchParams(
  filters: EventListUrlFilters
): URLSearchParams {
  const params = new URLSearchParams();
  const keyword = filters.keyword.trim();

  if (keyword) params.set("keyword", keyword);
  if (filters.statuses.length > 0) {
    params.set("statuses", filters.statuses.join(","));
  }
  if (filters.eventTypeCodes.length > 0) {
    params.set("eventTypes", filters.eventTypeCodes.join(","));
  }
  if (filters.page > 1) params.set("page", String(filters.page));

  return params;
}

export function buildEventListPath(filters: EventListUrlFilters): string {
  const query = buildEventListSearchParams(filters).toString();
  return query ? `${EVENT_LIST_PATH}?${query}` : EVENT_LIST_PATH;
}
