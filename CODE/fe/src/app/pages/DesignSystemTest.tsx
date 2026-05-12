import { useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, Input, Select, SelectItem } from "../components/ui";

const colorSamples = [
  { label: "Background", className: "bg-color-background text-color-foreground border-color-border" },
  { label: "Card", className: "bg-color-card text-color-card-foreground border-color-border" },
  { label: "Primary", className: "bg-color-primary text-color-primary-foreground border-color-primary" },
  { label: "Secondary", className: "bg-color-secondary text-color-secondary-foreground border-color-border" },
  { label: "Muted", className: "bg-color-muted text-color-muted-foreground border-color-border" },
  { label: "Destructive", className: "bg-color-destructive text-color-destructive-foreground border-color-destructive" },
  { label: "Success", className: "bg-color-status-success-surface text-color-status-success border-color-status-success-border" },
  { label: "Warning", className: "bg-color-status-warning-surface text-color-status-warning border-color-status-warning-border" },
  { label: "Info", className: "bg-color-status-info-surface text-color-status-info border-color-status-info-border" }
];

export function DesignSystemTest() {
  const [selectValue, setSelectValue] = useState("open");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-color-foreground">Design System Test</h1>
          <p className="mt-1 text-sm text-color-muted-foreground">
            Komponen inti, token warna, dan state interaktif dalam satu permukaan validasi.
          </p>
        </div>
        <Badge color="primary" variant="outline">
          Dark mode ready
        </Badge>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-color-foreground">Color Tokens</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {colorSamples.map((sample) => (
            <div key={sample.label} className={`rounded-lg border p-4 text-sm font-semibold ${sample.className}`}>
              {sample.label}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-color-foreground">Buttons</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button color="primary">Primary</Button>
              <Button color="secondary">Secondary</Button>
              <Button color="destructive">Destructive</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button isLoading>Loading</Button>
              <Button disabled>Disabled</Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-color-foreground">Inputs</h2>
          </CardHeader>
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Input label="Email" placeholder="name@example.com" helperText="Gunakan email kantor." />
            <Input label="Dengan error" placeholder="name@example.com" error="Email tidak valid." />
            <Input label="Disabled" placeholder="Tidak aktif" disabled />
            <Select label="Status" value={selectValue} onValueChange={setSelectValue}>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </Select>
          </CardBody>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-color-foreground">Badges</h2>
        <Card>
          <CardBody className="flex flex-wrap gap-2">
            <Badge color="primary">Primary</Badge>
            <Badge color="success">Success</Badge>
            <Badge color="warning">Warning</Badge>
            <Badge color="destructive">Error</Badge>
            <Badge color="secondary">Secondary</Badge>
            <Badge color="primary" variant="outline">Outline</Badge>
            <Badge color="success" variant="outline">Success Outline</Badge>
            <Badge color="warning" variant="outline">Warning Outline</Badge>
            <Badge color="destructive" variant="outline">Error Outline</Badge>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
