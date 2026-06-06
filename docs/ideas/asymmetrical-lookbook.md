# Asymmetrical Lookbook Redesign

## Problem Statement
How Might We refine the Stop-Shop homepage layout and interaction details to create a premium, asymmetrical, and highly visual editorial lookbook experience?

## Recommended Direction
We will transition the storefront from a traditional grid into a spacious, asymmetrical lookbook. By removing card borders, backgrounds, and shadows, products will float as print-like assets directly on the warm Canvas Bone matte paper. 

Visual breaks (offset margins, uppercase monospace typography labels, and horizontal swipe lookbooks) will be used to divide categories. Subtle spring-loaded micro-motions (press scaling and smooth image zooms) will make the minimalist layout feel responsive and tactile.

## Key Assumptions to Validate
- [ ] The asymmetrical grid layout collapses cleanly and remains readable on narrow mobile viewports.
- [ ] Product imagery adapts well to varying aspect ratios in offset layouts.
- [ ] Whitespace feels intentional and luxury-grade rather than feeling like missing content.

## MVP Scope
*   **In Scope:**
    *   **Borderless Cards:** Refactor `ProductCard.jsx` to remove all borders, shadows, and card background blocks, leaving only the product image, monospace price, and title.
    *   **Asymmetrical Grid:** Update `ProductGrid.jsx` to use Tailwind offset classes and grid spans (e.g., index-based sizing where specific items span 2 columns or have vertical margin shifts).
    *   **Micro-Motion:** Add spring active scale-down press transitions (`active-scale`) to product items and links.
*   **Out of Scope:**
    *   Dark mode theme switching (remaining focused on the warm bone and charcoal color story).
    *   Dynamic layout customization by the user (maintaining a strictly curated, fixed lookbook design).

## Not Doing (and Why)
- **Grid Density Options:** Avoid letting users change spacing or density, as the visual balance of whitespace is a core brand asset that must remain fixed.
- **3D Interactive Viewers:** Omitted to prioritize fast load times and keep the clean, two-dimensional print catalog aesthetic.

## Open Questions
- Should the asymmetrical patterns follow a repeating loop (e.g., every 3rd and 7th card is offset) or be randomized based on the product list length?
