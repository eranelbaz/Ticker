# Project TODO List

## High Priority
- [x] **Implement `cn` utility and refactor class name logic**: Create a utility function using `clsx` and `tailwind-merge` to handle conditional classes cleanly, replacing `.join(' ')` in components.

## Medium Priority
- [x] **Refactor Tool Icons & Mapping**: Move SVG icon components from `DrawingToolbar.tsx` to a dedicated directory (`apps/web/src/components/icons`) and use a Record-based mapping of tools to their respective icons.
- [x] **Add tests for `RectanglePrimitive.ts`**: Implement unit tests for the rectangle drawing primitive in `apps/web/src/drawings/` to ensure correct coordinate calculation and rendering logic.

## Low Priority
- [x] **Clean up unused imports**: Scan drawing files (`LinePrimitive.ts`, `RectanglePrimitive.ts`) and remove any unused imports, specifically `CanvasRenderingTarget2D`.

