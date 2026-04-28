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

export async function fetchMasterReferences(type?: MasterReferenceType) {
  if (type) {
    const response = await apiRequest<ApiReferenceItem[]>(endpointMap[type], { method: "GET" });
    return sortItems(response.data.map((item) => mapReferenceItem(type, item)));
  }

  const [organizations, units, positions] = await Promise.all([
    apiRequest<ApiReferenceItem[]>(endpointMap.organization, { method: "GET" }),
    apiRequest<ApiReferenceItem[]>(endpointMap.unitOrganization, { method: "GET" }),
    apiRequest<ApiReferenceItem[]>(endpointMap.position, { method: "GET" })
  ]);

  return sortItems([
    ...organizations.data.map((item) => mapReferenceItem("organization", item)),
    ...units.data.map((item) => mapReferenceItem("unitOrganization", item)),
    ...positions.data.map((item) => mapReferenceItem("position", item))
  ]);
}

export async function createMasterReference(payload: MasterReferencePayload) {
  const response = await apiRequest<ApiReferenceItem>(endpointMap[payload.type], {
    method: "POST",
    body: {
      name: payload.name,
      status: payload.status
    }
  });
  return mapReferenceItem(payload.type, response.data);
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
  return mapReferenceItem(type, response.data);
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
  return mapReferenceItem(type, response.data);
}
