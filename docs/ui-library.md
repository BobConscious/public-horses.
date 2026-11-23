# Public Horses web UI library

Open `/design-system` in a running copy of Public Horses. The gallery uses the same React components as the project directory and organizer workspace. Its examples stay in the browser.

## Foundations

- [Brand kit](brand-kit.md) covers the logo, voice, imagery, type, and color.
- [CSS tokens](../src/tokens.css) define the shared color, type, spacing, controls, and motion values. The gallery offers the same file for download.
- [Page styles](../src/styles.css) define the site shell and shared layout. Keep page-specific styles next to their components.

## Components

| Component | Use |
| --- | --- |
| `Button` | Primary, outline, or plain action. Give it `href` for a link. Set `type="submit"` to send a form. |
| `Field` | Labeled text input, select, or textarea. Pass `hint` and `error` as text. Use native props such as `required`. |
| `Checkbox` | One labeled yes or no choice. Use `checked` and `onChange` when the choice changes the page. |
| `Notice` | Inline status. Set `tone="error"` for a problem the visitor needs to fix. |
| `StatusChip` | Shows the current review state in text. |
| `ListingFilters` | Controlled search, listing type, and field filters. Use `initialListingFilters` and `filterListings` together. |
| `ProjectCard` and `ProjectCards` | Display one or more opportunities. Supply the heading level for the page. Use `links={false}` in static examples. |
| `ProjectOrganizer` | Links to an organizer profile when one exists. Shows the organizer name as text when needed. |
| `EmptyProjects` and `LoadState` | Show the empty, filtered, loading, or failed directory state. Provide a retry or reset when it can help. |

Import controls from [controls.jsx](../src/components/controls.jsx), listings from [listings.jsx](../src/components/listings.jsx), and result states from [ui.jsx](../src/ui.jsx).

```jsx
<Field label="Project title" name="title" required maxLength={96} />
<Button type="submit">Save draft</Button>
```

## Page patterns

- **Directory.** Put the search and filters near the results. Announce the result count. Show what the organizer needs before background details.
- **Listing and organizer.** Keep the organizer link and project link distinct. Add a useful image description when a listing includes an image.
- **Draft and review.** Keep the current status visible. Label actions `Save draft`, `Submit for review`, `Request changes`, or `Publish project` as appropriate.
- **Feedback.** Put the error beside its field when possible. Keep the visitor’s input when they can fix the error.

## Verification

Run `npm test` and `npm run build`. Check the changed component in `/design-system` and in a page that uses it. Check narrow and wide layouts, keyboard focus, and any empty or error states.
