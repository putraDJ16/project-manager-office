export type MasterReferenceType = "organization" | "unitOrganization" | "position";
export type MasterReferenceStatus = "Active" | "Inactive";

export type MasterReferenceItem = {
  id: string;
  type: MasterReferenceType;
  name: string;
  status: MasterReferenceStatus;
};
