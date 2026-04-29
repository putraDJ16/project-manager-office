import { apiRequest } from "./apiClient";
import type {
  MasterReferenceItem,
  MasterReferenceStatus,
  MasterReferenceType
} from "../data/masterReferenceData";

type ApiReferenceItem = {
  id: string;
  name: string;
  status: MasterReferenceStatus;
};

type MasterReferencePayload = {
  type: MasterReferenceType;
  name: string;
  status: MasterReferenceStatus;
};

const endpointMap: Record<MasterReferenceType, string> = {
  organization: "/organizations",
  unitOrganization: "/organization-units",
  position: "/positions"
};

const MASTER_REFERENCE_CACHE_TTL_MS = 2 * 60 * 1000;

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

let allReferencesInFlight: Promise<MasterReferenceItem[]> | null = null;
const referencesByTypeInFlight: Partial<Record<MasterReferenceType, Promise<MasterReferenceItem[]>>> = {};
let allReferencesCache: CacheEntry<MasterReferenceItem[]> | null = null;
const referencesByTypeCache: Partial<Record<MasterReferenceType, CacheEntry<MasterReferenceItem[]>>> = {};

function mapReferenceItem(type: MasterReferenceType, item: ApiReferenceItem): MasterReferenceItem {
  return {
    id: item.id,
    type,
    name: item.name,
    status: item.status
  };
}

function sortItems(items: MasterReferenceItem[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, "id"));
}

function isCacheFresh<T>(cache: CacheEntry<T> | null | undefined) {
  return Boolean(cache && cache.expiresAt > Date.now());
}

function setAllReferencesCache(data: MasterReferenceItem[]) {
  allReferencesCache = {
    data: sortItems(data),
    expiresAt: Date.now() + MASTER_REFERENCE_CACHE_TTL_MS
  };
}

function setTypeCache(type: MasterReferenceType, data: MasterReferenceItem[]) {
  referencesByTypeCache[type] = {
    data: sortItems(data),
    expiresAt: Date.now() + MASTER_REFERENCE_CACHE_TTL_MS
  };
}

function upsertById(items: MasterReferenceItem[], nextItem: MasterReferenceItem) {
  const exists = items.some((item) => item.id === nextItem.id && item.type === nextItem.type);
  if (!exists) return sortItems([nextItem, ...items]);
  return sortItems(items.map((item) => (item.id === nextItem.id && item.type === nextItem.type ? nextItem : item)));
}

function syncReferenceCaches(nextItem: MasterReferenceItem) {
  const currentTypeCache = referencesByTypeCache[nextItem.type];
  if (currentTypeCache) {
    setTypeCache(nextItem.type, upsertById(currentTypeCache.data, nextItem));
  }

  if (allReferencesCache) {
    setAllReferencesCache(upsertById(allReferencesCache.data, nextItem));
  }
}

export async function fetchMasterReferences(type?: MasterReferenceType) {
  if (type) {
    const cachedByType = referencesByTypeCache[type];
    if (isCacheFresh(cachedByType)) return cachedByType!.data;
    if (referencesByTypeInFlight[type]) return referencesByTypeInFlight[type];

    referencesByTypeInFlight[type] = apiRequest<ApiReferenceItem[]>(endpointMap[type], { method: "GET" })
      .then((response) => {
        const mapped = sortItems(response.data.map((item) => mapReferenceItem(type, item)));
        setTypeCache(type, mapped);
        return mapped;
      })
      .finally(() => {
        delete referencesByTypeInFlight[type];
      });
    return referencesByTypeInFlight[type];
  }

  if (isCacheFresh(allReferencesCache)) return allReferencesCache!.data;
  if (allReferencesInFlight) return allReferencesInFlight;

  allReferencesInFlight = Promise.all([
    apiRequest<ApiReferenceItem[]>(endpointMap.organization, { method: "GET" }),
    apiRequest<ApiReferenceItem[]>(endpointMap.unitOrganization, { method: "GET" }),
    apiRequest<ApiReferenceItem[]>(endpointMap.position, { method: "GET" })
  ])
    .then(([organizations, units, positions]) => {
      const organizationItems = organizations.data.map((item) => mapReferenceItem("organization", item));
      const unitItems = units.data.map((item) => mapReferenceItem("unitOrganization", item));
      const positionItems = positions.data.map((item) => mapReferenceItem("position", item));

      setTypeCache("organization", organizationItems);
      setTypeCache("unitOrganization", unitItems);
      setTypeCache("position", positionItems);

      const combined = sortItems([...organizationItems, ...unitItems, ...positionItems]);
      setAllReferencesCache(combined);
      return combined;
    })
    .finally(() => {
      allReferencesInFlight = null;
    });

  return allReferencesInFlight;
}

export async function createMasterReference(payload: MasterReferencePayload) {
  const response = await apiRequest<ApiReferenceItem>(endpointMap[payload.type], {
    method: "POST",
    body: {
      name: payload.name,
      status: payload.status
    }
  });
  const created = mapReferenceItem(payload.type, response.data);
  syncReferenceCaches(created);
  return created;
}

export async function updateMasterReference(
  type: MasterReferenceType,
  id: string,
  payload: Partial<Pick<MasterReferenceItem, "name" | "status">>
) {
  const response = await apiRequest<ApiReferenceItem>(`${endpointMap[type]}/${id}`, {
    method: "PATCH",
    body: payload
  });
  const updated = mapReferenceItem(type, response.data);
  syncReferenceCaches(updated);
  return updated;
}

export async function updateMasterReferenceStatus(
  type: MasterReferenceType,
  id: string,
  status: MasterReferenceStatus
) {
  const response = await apiRequest<ApiReferenceItem>(`${endpointMap[type]}/${id}/status`, {
    method: "PATCH",
    body: { status }
  });
  const updated = mapReferenceItem(type, response.data);
  syncReferenceCaches(updated);
  return updated;
}
