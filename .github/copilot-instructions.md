# AI Agent Instructions for app-bodegas

## Project Overview
This is a Next.js 16 application for a bodega (warehouse) ordering system. The MVP implements a simple flow: view bodegas → view products → create pedido (order).

## Architecture
- **Frontend**: Next.js App Router with React 19, TypeScript, Tailwind CSS
- **Data Storage**:
  - Static data: CSV files in `data/` (bodegas.csv, productos.csv)
  - Dynamic data: JSON Lines format in `data/pedidos.jsonl` for append-only order logs
- **API**: `/api/pedidos` route handles order creation (POST) and listing (GET)
- **Dependencies**: `csv-parse` and `papaparse` for CSV parsing, standard Next.js stack

## Key Patterns
- **Data Parsing**: Use `safeNumber()` function for robust numeric conversion (handles null/undefined)
- **Order IDs**: Generate with `crypto.randomUUID()` or fallback to timestamp-based IDs
- **File Storage**: Ensure `data/` directory exists before writing; use JSONL for efficient appends
- **Types**: Define TypeScript interfaces for `Pedido`, `PedidoItem`, etc. in API routes
- **Runtime**: Specify `"nodejs"` runtime for API routes that use file system

## Workflows
- **Development**: `npm run dev` starts dev server
- **Build**: `npm run build` for production build
- **Lint**: `npm run lint` runs ESLint
- **Data Access**: Parse CSVs client-side using `papaparse` for bodegas/products data

## Conventions
- **Naming**: Spanish terms (bodega, pedido, producto); currency in COP
- **Context**: Colombian market, includes payment methods like Nequi, contraentrega
- **State Management**: No global state library; use React hooks for component state
- **Styling**: Tailwind CSS with custom classes; focus on responsive design

## Examples
- **Reading CSVs**: Use `papaparse.parse()` with header:true for structured data
- **Order Creation**: Validate `bodega_id` and `items` array; calculate totals server-side
- **Error Handling**: Return `{ok: false, error: string}` for API failures

## File Structure
- `app/page.tsx`: Home page with bodega link
- `app/api/pedidos/route.ts`: Order API (exemplifies JSONL storage pattern)
- `data/`: CSV files for static data, JSONL for orders</content>
<parameter name="filePath">c:\Users\loomb\OneDrive\Desktop\app\app-bodegas\.github\copilot-instructions.md