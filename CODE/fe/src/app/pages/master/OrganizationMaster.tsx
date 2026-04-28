import { ReferenceMaster } from "./ReferenceMaster";

export function OrganizationMaster() {
  return (
    <ReferenceMaster
      type="organization"
      breadcrumb="Organisasi"
      title="Master - Organisasi"
      addLabel="Tambah Organisasi"
      placeholder="Cari nama organisasi..."
    />
  );
}
