import { ReferenceMaster } from "./ReferenceMaster";

export function OrganizationUnitMaster() {
  return (
    <ReferenceMaster
      type="unitOrganization"
      breadcrumb="Unit Organisasi"
      title="Master - Unit Organisasi"
      addLabel="Tambah Unit Organisasi"
      placeholder="Cari nama unit organisasi..."
    />
  );
}
