# Component Library

Shared UI components live in `src/app/components/ui`, with form and layout components re-exported from the same public entry point.

## Import

```tsx
import {
  AppShell,
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  FormActions,
  FormField,
  Input,
  Select,
  SelectItem
} from "@/app/components/ui";
```

## Button

File: `src/app/components/ui/Button.tsx`

Props:
- `variant`: `"solid" | "outline" | "ghost"`
- `size`: `"sm" | "md" | "lg"`
- `color`: `"primary" | "secondary" | "destructive"`
- `isLoading`: `boolean`

Example:
```tsx
<Button color="primary">Simpan</Button>
<Button variant="outline" color="secondary">Batal</Button>
<Button variant="ghost" color="destructive">Hapus</Button>
<Button isLoading>Memproses...</Button>
```

## Input

File: `src/app/components/ui/Input.tsx`

Props:
- All native input props
- `label?: string`
- `error?: string`
- `helperText?: string`
- `leadingIcon?: React.ReactNode`

Example:
```tsx
<Input
  label="Email"
  type="email"
  placeholder="nama@zoho.local"
  helperText="Gunakan email kantor"
 />
```

## Badge

File: `src/app/components/ui/Badge.tsx`

Props:
- `color`: `"primary" | "success" | "warning" | "destructive" | "secondary"`
- `variant`: `"solid" | "outline"`

Example:
```tsx
<Badge color="success">Completed</Badge>
<Badge color="warning" variant="outline">Pending</Badge>
```

## Card

File: `src/app/components/ui/Card.tsx`

Exports:
- `Card`
- `CardHeader`
- `CardBody`
- `CardFooter`

Example:
```tsx
<Card>
  <CardHeader>
    <h2 className="text-lg font-semibold">Ringkasan</h2>
  </CardHeader>
  <CardBody>Isi konten</CardBody>
  <CardFooter>
    <Button>Simpan</Button>
  </CardFooter>
</Card>
```

## Select

File: `src/app/components/ui/Select.tsx`

Exports:
- `Select`
- `SelectItem`

Props:
- `label?: string`
- `error?: string`
- `placeholder?: string`
- `value?: string`
- `onValueChange?: (value: string) => void`
- `disabled?: boolean`

Example:
```tsx
<Select label="Status" value={status} onValueChange={setStatus}>
  <SelectItem value="open">Open</SelectItem>
  <SelectItem value="closed">Closed</SelectItem>
</Select>
```

## FormField

File: `src/app/components/forms/FormField.tsx`

Purpose: Wraps a form control with a label, required marker, helper text, and validation error.

Props:
- All native `div` props
- `label?: string`
- `htmlFor?: string`
- `error?: string`
- `helperText?: string`
- `isRequired?: boolean`

Example:
```tsx
<FormField
  label="Nama proyek"
  htmlFor="project-name"
  isRequired
  error={errors.name}
>
  <Input id="project-name" value={name} onChange={handleNameChange} />
</FormField>
```

When to use:
- Building forms that need consistent label, helper, and error spacing
- Grouping custom controls that are not covered by `Input` or `Select`

When not to use:
- Standalone fields already handled by `Input` or `Select` labels
- Non-form content

## FormActions

File: `src/app/components/forms/FormActions.tsx`

Purpose: Provides consistent spacing and alignment for form action buttons.

Props:
- All native `div` props
- `align?: "start" | "center" | "end" | "between"`

Example:
```tsx
<FormActions align="between">
  <Button variant="outline" color="secondary" type="button">
    Batal
  </Button>
  <Button color="primary" type="submit" isLoading={isSaving}>
    Simpan
  </Button>
</FormActions>
```

When to use:
- At the bottom of forms with submit, cancel, or secondary actions
- Any form section that needs consistent action spacing

## AppShell

File: `src/app/components/layout/AppShell.tsx`

Purpose: Authenticated application frame with sidebar navigation, top bar, notifications, theme toggle, and routed page content.

Props:
- `session: AuthSession`
- `onLogout: () => void`
- `themeMode: ThemeMode`
- `onToggleTheme: () => void`

Example:
```tsx
<AppShell
  session={session}
  onLogout={handleLogout}
  themeMode={themeMode}
  onToggleTheme={toggleTheme}
/>
```

When to use:
- Wrapping authenticated routes that render through React Router `Outlet`
- Providing the main application navigation, notification, and account chrome

## Usage Rules

- Prefer shared components for forms and actions.
- Import shared UI, form, and layout components from `src/app/components/ui`.
- Use semantic token classes from `src/DESIGN_TOKENS.md`.
- Add new shared component to `src/app/components/ui/index.ts`.
