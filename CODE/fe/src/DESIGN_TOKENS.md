# Design Tokens

Token source:
- CSS variables: `src/styles/theme.css`
- Tailwind mappings: `src/styles/tailwind.css`

Use semantic tokens first. Avoid direct Tailwind palette classes in shared components.

## Colors

| Token class | CSS variable | Usage |
| --- | --- | --- |
| `bg-color-background` | `--background` | App/page background |
| `text-color-foreground` | `--foreground` | Default text |
| `bg-color-card` | `--card` | Card/surface background |
| `text-color-card-foreground` | `--card-foreground` | Text on card |
| `bg-color-popover` | `--popover` | Overlay/dropdown background |
| `text-color-popover-foreground` | `--popover-foreground` | Text on overlay |
| `bg-color-primary` | `--primary` | Primary action |
| `text-color-primary` | `--primary` | Primary text/icon |
| `text-color-primary-foreground` | `--primary-foreground` | Text on primary background |
| `bg-color-secondary` | `--secondary` | Secondary action/surface |
| `text-color-secondary-foreground` | `--secondary-foreground` | Text on secondary background |
| `bg-color-muted` | `--muted` | Muted surface |
| `text-color-muted-foreground` | `--muted-foreground` | Secondary text |
| `bg-color-accent` | `--accent` | Hover/selected surface |
| `text-color-accent-foreground` | `--accent-foreground` | Text on accent |
| `bg-color-destructive` | `--destructive` | Delete/error action |
| `text-color-destructive` | `--destructive` | Error text |
| `text-color-destructive-foreground` | `--destructive-foreground` | Text on destructive background |
| `bg-color-status-success-surface` | `--status-success-surface` | Success badge/notice surface |
| `text-color-status-success` | `--status-success` | Success text/icon |
| `border-color-status-success-border` | `--status-success-border` | Success border |
| `bg-color-status-warning-surface` | `--status-warning-surface` | Warning badge/notice surface |
| `text-color-status-warning` | `--status-warning` | Warning text/icon |
| `border-color-status-warning-border` | `--status-warning-border` | Warning border |
| `bg-color-status-info-surface` | `--status-info-surface` | Informational surface |
| `text-color-status-info` | `--status-info` | Informational text/icon |
| `border-color-status-info-border` | `--status-info-border` | Informational border |
| `border-color-border` | `--border` | Default border |
| `border-color-input` | `--input` | Input border |
| `ring-color-ring` | `--ring` | Focus ring |

Status tokens are for reusable components and repeated status patterns. Use destructive tokens for errors, deletes, and failed validation.

## Typography

| Class | Usage |
| --- | --- |
| `text-xs` | Metadata, badges, helper text |
| `text-sm` | Forms, table cells, body-small |
| `text-base` | Main body text |
| `text-lg font-semibold` | Card/section headings |
| `text-2xl font-bold` | Page headings |

Guidelines:
- Use `text-color-foreground` for primary text.
- Use `text-color-muted-foreground` for descriptions.
- Avoid repeating `text-sm` without hierarchy; choose heading/body/helper level.

## Spacing

| Class | Usage |
| --- | --- |
| `gap-2` | Inline controls |
| `gap-3` | Form grids |
| `gap-4` | Card content groups |
| `p-4` | Compact card/panel |
| `px-6 py-4` | Standard card sections |
| `p-6` | Page sections |
| `space-y-4` | Form vertical rhythm |

## Radius

| Class | Source | Usage |
| --- | --- | --- |
| `rounded-sm` | `--radius-sm` | Small controls |
| `rounded-md` | `--radius-md` | Inputs/buttons |
| `rounded-lg` | `--radius-lg` | Cards/panels |

## Shadows

Shadow scale provides consistent depth cues across the interface.

| Class | CSS variable | Light | Dark | Usage |
| --- | --- | --- | --- | --- |
| `shadow-sm` | `--shadow-sm` | 5% opacity | 15% opacity | Subtle elevation, input focus states |
| `shadow-md` | `--shadow-md` | 8% opacity | 25% opacity | Default cards, buttons, modest elevation |
| `shadow-lg` | `--shadow-lg` | 12% opacity | 35% opacity | Important cards, dropdowns, prominent cards |
| `shadow-xl` | `--shadow-xl` | 14% opacity | 42% opacity | Modals, popovers, dialogs, maximum elevation |
| `ds-elevated-shadow` | `--shadow-elevated` | Alias for `--shadow-xl` | Alias for `--shadow-xl` | Backwards-compatible prominent elevation |

Directional shadows are available for fixed panels and sticky sidebars:
- `shadow-right-md` / `shadow-right-lg` for right-edge separation.
- `shadow-left-md` / `shadow-left-lg` for left-edge separation.

Usage:

```tsx
<div className="shadow-sm">Subtle depth</div>
<Card className="shadow-md">Default card</Card>
<Popover className="shadow-lg">Prominent overlay</Popover>
<Tooltip contentStyle={{ boxShadow: "var(--shadow-lg)" }} />
<aside className="shadow-right-lg">Sticky sidebar</aside>
```

Guidelines:
- Use the semantic shadow classes from the scale.
- Use CSS variables in inline styles when `className` is not available.
- Avoid hardcoded `boxShadow` values and arbitrary `shadow-[...]` classes.

## Surface Utilities

| Class | CSS variable | Usage |
| --- | --- | --- |
| `ds-page-gradient` | `--surface-gradient` | Full-page authenticated/marketing-like background |
| `ds-elevated-shadow` | `--shadow-elevated` | Backwards-compatible alias for `shadow-xl` |
| `ds-status-success` | `--status-success-*` | Success notice/status block |
| `ds-status-warning` | `--status-warning-*` | Warning notice/status block |
| `ds-status-info` | `--status-info-*` | Informational notice/status block |

## Component Rules

- Shared UI components live in `src/app/components/ui`.
- Export through `src/app/components/ui/index.ts`.
- Use `cn()` from `@/lib/utils` for class composition.
- Use semantic color tokens for theme-aware styling.
- Page-specific layout can keep Tailwind utilities, but reusable controls should use components.

## Dark Mode Support

Dark mode is driven by CSS variables in `src/styles/theme.css`. The app activates dark mode by adding the `.dark` class to the `<html>` element; `applyTheme()` in `src/app/utils/theme.ts` also updates `data-theme`, `color-scheme`, and local storage.

```html
<html class="dark" data-theme="dark">
  ...
</html>
```

### Testing Dark Mode

Use the app shell theme button for persistent manual testing, or run this in the browser console:

```js
document.documentElement.classList.toggle("dark");
```

A consolidated component validation page is available at `/design-system-test` after login. Use it to compare buttons, inputs, selects, badges, cards, and token swatches in light and dark modes.

### Guidelines

- Use semantic token classes such as `text-color-foreground`, `text-color-muted-foreground`, `bg-color-card`, `border-color-border`, and `ring-color-ring`.
- Use CSS variables for chart and inline styles, for example `fill="var(--primary)"` or `style={{ color: "var(--muted-foreground)" }}`.
- Verify WCAG AA contrast for normal text at 4.5:1 and UI boundaries at 3:1.
- Keep hardcoded palette classes out of shared UI components. Page-level legacy palette classes are covered by the dark-mode compatibility layer in `src/styles/index.css`, but new code should prefer tokens.

Common fixes:

```tsx
// Avoid hardcoded text colors in shared surfaces.
<span className="text-color-muted-foreground">Helper text</span>

// Use CSS variables for charts and third-party renderers.
<Bar fill="var(--primary)" />

// Use semantic borders so form controls remain visible.
<div className="border border-color-border" />
```
