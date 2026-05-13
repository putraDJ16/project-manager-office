# Feature Context: Master Data

## Purpose

Mengelola role, employee, organization, organization unit, dan position.

## Business Flow

1. Admin/role berizin membuka halaman master.
2. Frontend memuat data master melalui API.
3. User membuat/mengubah/status-toggle data master.
4. Employee create juga membuat/menautkan user dan default password.
5. Role permissions menentukan akses halaman/API.

## User Roles / Permissions

Setiap resource punya module permission sendiri: `masterRoles`, `masterEmployees`, `masterOrganizations`, `masterOrganizationUnits`, `masterPositions`.

## Main Backend Files

- `CODE/be/app/api/v1/roles.py`
- `CODE/be/app/api/v1/employees.py`
- `CODE/be/app/api/v1/organizations.py`
- `CODE/be/app/api/v1/organization_units.py`
- `CODE/be/app/api/v1/positions.py`
- `CODE/be/app/services/role_service.py`
- `CODE/be/app/services/employee_service.py`
- `CODE/be/app/services/organization_service.py`
- `CODE/be/app/services/organization_unit_service.py`
- `CODE/be/app/services/position_service.py`

## Main Frontend Files

- `CODE/fe/src/app/pages/master/RoleMaster.tsx`
- `CODE/fe/src/app/pages/master/EmployeeMaster.tsx`
- `CODE/fe/src/app/pages/master/OrganizationMaster.tsx`
- `CODE/fe/src/app/pages/master/OrganizationUnitMaster.tsx`
- `CODE/fe/src/app/pages/master/PositionMaster.tsx`
- `CODE/fe/src/app/services/masterApi.ts`
- `CODE/fe/src/app/services/masterReferenceApi.ts`

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST | `/api/v1/roles` | List/create role |
| PATCH | `/api/v1/roles/<role_id>` | Update role |
| PATCH | `/api/v1/roles/<role_id>/status` | Update role status |
| GET/POST | `/api/v1/employees` | List/create employee |
| PATCH | `/api/v1/employees/<employee_id>` | Update employee |
| PATCH | `/api/v1/employees/<employee_id>/status` | Update employee status |
| POST | `/api/v1/employees/<employee_id>/reset-password` | Reset employee user password |
| GET/POST | `/api/v1/organizations` | List/create organization |
| PATCH | `/api/v1/organizations/<organization_id>` | Update organization |
| PATCH | `/api/v1/organizations/<organization_id>/status` | Update organization status |
| GET/POST | `/api/v1/organization-units` | List/create organization unit |
| PATCH | `/api/v1/organization-units/<unit_id>` | Update organization unit |
| PATCH | `/api/v1/organization-units/<unit_id>/status` | Update organization unit status |
| GET/POST | `/api/v1/positions` | List/create position |
| PATCH | `/api/v1/positions/<position_id>` | Update position |
| PATCH | `/api/v1/positions/<position_id>/status` | Update position status |

## Database / Models

| Table/Model | Usage |
|---|---|
| `roles` / `Role` | Role permission data |
| `employees` / `Employee` | Employee master |
| `users` / `User` | Employee-linked login account |
| `organizations` / `Organization` | Organization reference |
| `organization_units` / `OrganizationUnit` | Unit reference |
| `positions` / `Position` | Position reference |

## Validation Rules

- Role name and description required; role name unique.
- Employee required fields include NIP, name, email, organization, unit organization, position, role_id.
- Employee NIP/email unique.
- Employee role/reference values must exist and be active for new data.
- Organization/unit/position name required and unique.
- Status fields use `Active` or `Inactive`.

## Error Handling

Validation uses `ApiError` with optional field-level `errors`. Missing records use 404.

## Tests

- `CODE/be/tests/test_master_api.py`
- `CODE/be/tests/test_employee_service.py`

## Safe Modification Scope

- Master API/service/repository/model/schema files for the affected resource.
- Matching frontend master page and service file.

## Do Not Change

- Jangan ubah permission module keys casually; route/API access depends on them.
- Jangan expose default password behavior changes without test updates.

## Common Change Scenarios

- Menambah permission module.
- Menambah employee field.
- Menambah master reference validation.
- Mengubah role permission defaults.
