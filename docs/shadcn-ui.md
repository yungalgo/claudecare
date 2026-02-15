# shadcn/ui - Vite Installation Guide

## Setup Steps

### 1. Add Tailwind CSS
```bash
bun add tailwindcss @tailwindcss/vite
```

In `src/index.css`:
```css
@import "tailwindcss";
```

### 2. Configure TypeScript paths
In `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 3. Configure Vite
```typescript
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

### 4. Initialize shadcn/ui
```bash
bunx shadcn@latest init
```

### 5. Add components
```bash
bunx shadcn@latest add button card table input dialog badge
```

## References
- https://ui.shadcn.com/docs/installation/vite
- https://ui.shadcn.com/docs/components
