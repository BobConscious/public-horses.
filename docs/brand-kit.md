# Public Horses brand kit

Public Horses is the Buddhist volunteer platform. Where service is a practice.

Individuals and organizations post specific ways to help. Supporters fulfill opportunities through the organizer.

- **Name.** Use **Public Horses** in public copy. The shared village horse gives us an example of lifelong service.
- **Short description.** Find a way to serve or post a service opportunity.
- **Supporter path.** Find an opportunity. Help through the organizer. Record what you did and reflect on it.
- **Organizer path.** Make a specific request. Submit it for review. Mark it fulfilled when the help meets the need.
- **Private garden.** Each recorded act gives the supporter a seed. The journal lets them reflect on what they want to cultivate and what they notice later.

## Voice

Use plain verbs and specific needs. Lead with the work, who is doing it, and how to help.

| Situation | Example |
| --- | --- |
| Listing title | Help digitize media archives |
| Specific request | Help prepare and label scanned files. |
| Primary actions | Find a way to serve, Post a service opportunity, Visit organizer |
| Service record | Record service you already gave. |
| Review | Draft, Under review, Needs changes, Published, Closed, Fulfilled |

Use the organizer’s name when available. Use “recorded help” for self-reported acts. Use exact figures when the source supports them.

## Visual direction

Use the paper tones, restrained color, and close observation of historic botanical studies. Give artwork room on the home page, About page, and garden.

Use 8 px corners on controls and 14 px corners on cards and panels. Keep the horse mark square and full-width artwork straight at the edges.

Keep search, listings, and forms direct. Kiva provides a reference for searchable results, useful filters, concrete asks, and clear next steps. Public Horses uses these patterns for direct community support. [Kiva’s directory](https://www.kiva.org/lend/filter) · [How Kiva works](https://www.kiva.org/about/how)

Show the listing type, title, organizer, and specific request first. Include available facts such as place, schedule, and ways to help. Use a compact card with or without an image.

## Logo

The horse outline and square form the mark. The horizontal lockup pairs the mark with the Public Horses name.

| Download | Use |
| --- | --- |
| [Primary mark](../public/brand/mark.svg) | Small brand placements on light surfaces |
| [Reverse mark](../public/brand/mark-reverse.svg) | Small brand placements on dark surfaces |
| [Primary lockup](../public/brand/lockup.svg) | Light paper, cream, or a similarly light surface |
| [Reverse lockup](../public/brand/lockup-reverse.svg) | Forest, dark ink, or a similarly dark surface |

Leave clear space of at least one quarter of the square’s width around the artwork. Use a square at least 24 CSS pixels wide or a lockup at least 150 CSS pixels wide. Use the mark for a favicon. Put the logo on a quiet surface with good contrast. Scale both dimensions together and use the supplied colors.

The lockups contain outlined lettering. They open without a font file. Export to PNG at the size the destination requires.

## Color and type

Use [the CSS tokens](../src/tokens.css) as the source for web values. The component gallery at `/design-system` shows the palette in context.

| Token | Value | Role |
| --- | --- | --- |
| `--cream` | `#F6F1E5` | Main background |
| `--paper` | `#FFFCF3` | Cards, panels, and forms |
| `--ink` | `#21392D` | Headings and strong text |
| `--forest` | `#224733` | Horse mark and primary actions |
| `--on-forest` | `#FFFDF4` | Text on primary actions |
| `--forest-dark` | `#173523` | Primary action hover and dark surfaces |
| `--muted` | `#556358` | Supporting text |
| `--accent` | `#9A4838` | Keyboard focus and a warm accent |
| `--sage` | `#E6EBD8` | Selected and calm support surfaces |
| `--line` | `#D9D6C7` | Dividers and card rules |
| `--control-border` | `#758371` | Boundaries that identify controls |

Use Georgia for page and section headings. Use the body font stack for controls, listing facts, and body copy. It starts with Inter when installed and falls back to Segoe UI or the system sans serif. Use sentence case. Keep field labels and status labels easy to scan.

Ink on paper measures 12.13:1. Muted text on cream measures 5.63:1. Primary button text on forest measures 10.22:1. The control border on paper measures 3.91:1. Aim for at least 4.5:1 for ordinary text and 3:1 for required control boundaries and focus indicators. Reserve the light divider color for decoration. [WCAG text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) · [WCAG control contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)

## Artwork

Use a whole botanical plate where the specimen matters. Crop scenery around its main subject. Keep text on a solid, quiet surface. For a real listing, prefer an organizer-supplied photo with permission. Give meaningful images short descriptions. Set empty alternative text when the same information is already present in text or the image is decorative.

| Artwork | Source and use |
| --- | --- |
| [Swamp Azalea](../public/art/swamp-azalea.jpg) | Mary Vaux Walcott, 1918. Smithsonian American Art Museum, CC0. Garden detail. [Collection record](https://www.si.edu/es/object/swamp-azalea-azalea-viscosa%3Asaam_1970.355.257) |
| [Swamp Magnolia](../public/brand/botanical-swamp-magnolia.webp) | Mary Vaux Walcott, 1918. Smithsonian American Art Museum, CC0. Botanical plate. [Collection record](https://www.si.edu/object/swamp-magnolia-magnolia-virginiana%3Asaam_1970.355.18) |
| [Wake-Robin](../public/brand/botanical-wake-robin.webp) | Mary Vaux Walcott, 1918. Smithsonian American Art Museum, CC0. Botanical plate. [Collection record](https://www.si.edu/object/wake-robin-trillium-grandiflorum%3Asaam_1970.355.17) |
| [Flower Garden and Bungalow, Bermuda](../public/art/flower-garden.jpg) | Winslow Homer, 1899. The Metropolitan Museum of Art, public domain. Home page garden. [Collection record](https://www.metmuseum.org/art/collection/search/11121) |
| [City and Sunset](../server/fixtures/city-sunset.webp) | Henry Farrer. The Metropolitan Museum of Art, public domain. Sample event illustration. [Collection record](https://www.metmuseum.org/art/collection/search/10872) |
| [Flower path](../public/art/about-flower-path.webp), [garden pond](../public/art/about-garden-pond.webp), [horse meadow](../public/art/about-horse-meadow.webp) | Generated illustrations for the About page. |
| [Watercolor meadow](../public/art/garden/watercolor-meadow.webp) | Generated grass and paper texture for the walkable garden. |

Keep the artist, institution, credit, and source link with each archival image. Label illustrations as illustrations when readers could mistake them for project photos.

## Before publishing

- Check the copy against the listing or the organizer’s source.
- Check keyboard focus, contrast, and the narrow layout. Use text labels to communicate status.
- Keep motion optional. Honor the browser’s reduced-motion setting.
