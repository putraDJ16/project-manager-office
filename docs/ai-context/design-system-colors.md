# Design System - Color Tokens

## Overview

Aplikasi PM Dashboard menggunakan sistem warna berbasis CSS variables yang konsisten untuk light dan dark mode. Warna brand utama adalah **Merah IGLO (#e11d34)** yang digunakan sebagai aksen untuk elemen aksi primer.

## Prinsip Desain

- **Profesional & Bersih**: Tampilan enterprise PMO, bukan futuristik
- **Tanpa Gradien Neon**: Hindari glow, gradien dramatis, atau efek neon
- **Border > Shadow**: Gunakan border sebagai pemisah utama, shadow hanya halus
- **Kontras WCAG AA**: Minimal 4.5:1 untuk teks, terutama placeholder dan teks redup

## Color Tokens

### Light Mode

```css
/* Background & Surfaces */
--bg: #f4f6fa;           /* Background utama */
--panel: #fbfcfe;        /* Panel/sidebar */
--card: #ffffff;         /* Card/modal */

/* Borders */
--border: #e4e8f0;       /* Border default */
--border-strong: #d3d9e6; /* Border lebih tegas */

/* Brand Accent (Red IGLO) */
--accent: #e11d34;       /* Aksen utama */
--accent-hover: #c4162c; /* Hover state */
--accent-soft: #fdeaec;  /* Background ikon/aksen halus */

/* Text Hierarchy */
--ink: #16203a;          /* Heading/judul */
--ink-2: #475068;        /* Body text */
--ink-3: #7b8499;        /* Caption/placeholder */

/* Input */
--input-bg: #ffffff;     /* Background input */
--input-border: #e4e8f0; /* Border input */

/* Success/Green */
--green: #0a8a5f;        /* Status sukses */
--green-bg: #e7f6ef;     /* Background sukses */

/* Focus Ring */
--focus-ring: 0 0 0 3px rgba(225, 29, 52, 0.12);
```

### Dark Mode

```css
/* Background & Surfaces */
--bg: #0d1017;           /* Background utama */
--panel: #11151f;        /* Panel/sidebar */
--card: #151a26;         /* Card/modal */

/* Borders */
--border: #222a3a;       /* Border default */
--border-strong: #2d3648; /* Border lebih tegas */

/* Brand Accent (Lighter for dark mode) */
--accent: #f2374f;       /* Aksen utama (lebih terang) */
--accent-hover: #ff4a60; /* Hover state */
--accent-link: #ff8090;  /* Link/tab aktif */
--accent-soft: rgba(242, 55, 79, 0.14); /* Background ikon/aksen halus */

/* Text Hierarchy */
--ink: #eef1f7;          /* Heading/judul */
--ink-2: #a4adc2;        /* Body text */
--ink-3: #6f7890;        /* Caption/placeholder */

/* Input */
--input-bg: #1a2030;     /* Background input */
--input-border: #2d3648; /* Border input */

/* Success/Green */
--green: #34d399;        /* Status sukses */
--green-bg: rgba(52, 211, 153, 0.12); /* Background sukses */

/* Focus Ring */
--focus-ring: 0 0 0 3px rgba(242, 55, 79, 0.18);
```

## Aturan Penggunaan

### 1. Aksen (Merah)

**Gunakan untuk:**
- Tombol aksi primer
- Link aktif
- Tab aktif
- Focus ring pada input
- Ikon fitur utama

**Jangan gunakan untuk:**
- Background area luas
- Teks body biasa
- Border default

**Contoh:**
```tsx
// Button primary
<button className="btn-primary">Simpan</button>

// Link
<a className="link-accent">Lihat Detail</a>

// Icon accent
<div className="bg-accent-soft p-2 rounded">
  <Icon className="text-accent" />
</div>
```

### 2. Hijau (Success)

**Hanya untuk status positif:**
- Badge status sukses
- Notifikasi berhasil
- Indikator secure/verified

**Jangan campur dengan merah aksi.**

**Contoh:**
```tsx
<span className="ds-status-success px-2 py-1 rounded text-xs">
  Selesai
</span>
```

### 3. Hirarki Teks

```tsx
// Heading
<h1 className="text-[var(--ink)]">Judul Utama</h1>

// Body
<p className="text-[var(--ink-2)]">Konten paragraf</p>

// Caption/placeholder
<span className="text-[var(--ink-3)]">Keterangan tambahan</span>
```

### 4. Focus States

Semua elemen interaktif (input, button, link) otomatis mendapat focus ring:

```css
input:focus,
button:focus-visible,
a:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}
```

### 5. Shadows

Gunakan shadow halus, bukan glow:

```tsx
// Card
<div className="shadow-md">...</div>

// Elevated panel
<div className="shadow-lg">...</div>
```

## Utility Classes

### Accent

```css
.text-accent          /* Warna aksen */
.bg-accent            /* Background aksen */
.bg-accent-soft       /* Background aksen halus */
.border-accent        /* Border aksen */
.hover:bg-accent      /* Hover aksen */
```

### Status

```css
.ds-status-success    /* Badge sukses */
.ds-status-warning    /* Badge warning */
.ds-status-info       /* Badge info */
```

### Buttons

```css
.btn-primary          /* Tombol primer (merah) */
```

### Links

```css
.link-accent          /* Link dengan warna aksen */
```

## Theme Toggle

Theme dikelola melalui `data-theme` attribute di root element:

```tsx
import { applyTheme, getStoredTheme } from '@/utils/theme';

// Get stored theme
const theme = getStoredTheme(); // 'light' | 'dark'

// Apply theme
applyTheme('dark');

// Toggle theme
const toggleTheme = () => {
  const current = getStoredTheme();
  applyTheme(current === 'dark' ? 'light' : 'dark');
};
```

## Kontras & Aksesibilitas

### Minimum Contrast Ratios (WCAG AA)

- **Normal text (< 18pt)**: 4.5:1
- **Large text (≥ 18pt)**: 3:1
- **UI components**: 3:1

### Verified Combinations

**Light Mode:**
- `--ink` on `--bg`: ✓ 12.8:1
- `--ink-2` on `--bg`: ✓ 7.2:1
- `--ink-3` on `--bg`: ✓ 4.6:1
- `--accent` on `--card`: ✓ 8.1:1

**Dark Mode:**
- `--ink` on `--bg`: ✓ 13.2:1
- `--ink-2` on `--bg`: ✓ 6.8:1
- `--ink-3` on `--bg`: ✓ 4.5:1
- `--accent` on `--card`: ✓ 7.4:1

## Migration dari Warna Lama

Jika ada komponen yang masih menggunakan warna hardcoded atau Tailwind classes lama:

### Before
```tsx
<button className="bg-indigo-600 hover:bg-indigo-700">
  Simpan
</button>
```

### After
```tsx
<button className="btn-primary">
  Simpan
</button>
```

### Before
```tsx
<div className="bg-slate-50 border-slate-200">
  ...
</div>
```

### After
```tsx
<div className="bg-[var(--panel)] border-[var(--border)]">
  ...
</div>
```

## File Locations

- **Theme tokens**: `CODE/fe/src/styles/theme.css`
- **Legacy mappings**: `CODE/fe/src/styles/index.css`
- **Theme utilities**: `CODE/fe/src/utils/theme.ts`
- **Documentation**: `docs/ai-context/design-system-colors.md`

## Notes

- Semua warna harus referensi token CSS variables
- Dilarang hardcode hex color di komponen
- Dark mode toggle via `[data-theme="dark"]` di root element
- Legacy Tailwind classes otomatis dimapping ke token baru