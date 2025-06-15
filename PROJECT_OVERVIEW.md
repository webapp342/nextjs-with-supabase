# PROJECT_OVERVIEW.md

This document provides a comprehensive overview of the full-stack e-commerce application, detailing its architecture, components, data flow, and more.

## 1. 🗂️ Project Structure Overview

The project is a modern Next.js application using the App Router. The structure is well-organized, separating concerns into logical directories.

-   **`app/`**: The core of the Next.js application.
    -   **`app/layout.tsx`**: The root layout of the application, which sets up the HTML shell, fonts (Geist), and theme provider (`next-themes`).
    -   **`app/page.tsx`**: The homepage of the application, composed of various UI components.
    -   **`app/api/`**: Likely contains API routes for server-side logic, though none were found during this review.
    -   **`app/auth/`**: Contains all authentication-related pages like login, sign-up, and password reset.
    -   **`app/protected/`**: A route group for the admin dashboard, protected by authentication. It contains pages for managing products, categories, banners, etc.
    -   **Dynamic route folders** (e.g., `app/category/[slug]`, `app/product-details/[id]`): These handle the display of specific data-driven pages.
-   **`components/`**: Contains all the React components used throughout the application.
    -   **`components/ui/`**: Contains reusable, low-level UI components (like `Button`, `Card`, `Input`) likely from a library like `shadcn/ui`.
    -   **Feature components** (e.g., `BestsellersSection`, `ProductCard`, `Navbar`): Larger components that make up the features of the application.
-   **`lib/`**: Contains libraries and utility functions.
    -   **`lib/supabase/`**: Contains the Supabase client initialization for both client-side (`client.ts`) and server-side (`server.ts`) rendering, correctly using `@supabase/ssr`.
    -   **`lib/redis.ts`**: Sets up the Redis connection using `ioredis` and provides a comprehensive set of utilities for caching.
    -   **`lib/utils.ts`**: A collection of utility functions, including `cn` for merging Tailwind CSS classes and `toPersianNumber` for localization.
-   **`utils/`**: Contains higher-level utilities.
    -   **`utils/cache.ts`**: Provides a powerful abstraction layer over Redis for caching application data, with features like tag-based invalidation and a `getOrSetCache` helper.
    -   **`utils/logger.ts`**: (Assumed) A logging utility, evidenced by its use in `cache.ts`.
-   **`public/`**: Contains static assets like images and fonts.
-   **Configuration Files**:
    -   **`next.config.ts`**: Configures Next.js, including remote image patterns for `next/image`.
    -   **`tsconfig.json`**: A strict TypeScript configuration with path aliases (`@/*`).
    -   **`tailwind.config.ts`**: Configuration for Tailwind CSS.
    -   **`package.json`**: Defines scripts and dependencies.

### Frontend-Backend Connection

The frontend (Next.js/React) connects to the Supabase backend in two primary ways:
1.  **Client-side**: Components marked with `'use client'` use the Supabase client from `lib/supabase/client.ts` to fetch data directly from the browser (e.g., `MobileMenu`, `BestsellersSection`).
2.  **Server-side**: Server Components (the default in the `app` router) use the server-side Supabase client from `lib/supabase/server.ts` to fetch data on the server before rendering, ensuring data is available on page load (e.g., `app/protected/page.tsx`).

## 2. 🧩 Component-Level Documentation

### `ProductCard`
-   **What it does**: Displays a single product with its image, name, brand, price, and any applicable discounts.
-   **Props**:
    -   `product: Product`: The product object to display.
    -   `showBadges?: boolean`: Whether to show badges for "bestseller", "new", etc.
    -   `size?: 'sm' | 'md' | 'lg'`: Controls the size of the card.
-   **Role**: A key reusable component for displaying products in lists, grids, and carousels across the application.

### `BestsellersSection`
-   **What it does**: Fetches and displays a horizontally scrolling list of best-selling products.
-   **Props**: None.
-   **Role**: A section on the homepage to highlight popular products. It fetches its own data client-side.

### `MobileMenu`
-   **What it does**: A slide-out navigation menu for mobile devices that displays product categories.
-   **Props**: None.
-   **Role**: The primary navigation on smaller screens. It fetches categories from Supabase and includes a loading state and error fallback.

### `AdminDashboard`
-   **What it does**: The main dashboard for the admin area, displaying statistics and providing quick actions for content management.
-   **Props**: None.
--   **Role**: The entry point for authenticated admin users to manage the e-commerce store.

## 3. 🗃️ Database & Supabase Layer

-   **How Supabase is used**: Supabase serves as the primary backend, providing a PostgreSQL database, authentication, and storage.
-   **Tables (Inferred)**:
    -   `products`: Stores product information (name, price, images, etc.).
    -   `categories_new`: Stores product categories in a hierarchical structure.
    -   `brands`: Stores brand information.
    -   `category_banners`: Stores banners associated with categories.
-   **Data Operations**: Data is read and written using the `supabase-js` library. Server-side operations use `lib/supabase/server.ts`, and client-side operations use `lib/supabase/client.ts`.
-   **Authentication**: Supabase Auth is used for user authentication. The application has a complete flow for sign-up, login, and password management. Row-Level Security (RLS) is likely configured in Supabase to control data access, though this is not visible from the codebase alone.

## 4. ⚙️ Redis & Caching

-   **Integration**: Redis is integrated via the `ioredis` library. The configuration in `lib/redis.ts` is robust, supporting both local and production environments (e.g., Upstash).
-   **What gets cached**: The caching strategy is well-defined in `lib/redis.ts` with specific cache keys for products, categories, brands, banners, and homepage content.
-   **Cache Invalidation**: `utils/cache.ts` implements a sophisticated tag-based invalidation strategy. This allows for granular control, such as invalidating all caches related to a specific product when it's updated.
-   **When Redis is read vs. Supabase**: The `getOrSetCache` function in `utils/cache.ts` defines the pattern: first, try to read from Redis. If the data is not in the cache (a cache miss), fetch it from Supabase, and then store it in Redis for future requests. However, it appears this caching layer is not yet fully implemented across all components, as some still fetch directly from Supabase.

## 5. 🌐 Network/API Flow

-   **Data Flow**:
    1.  A user requests a page.
    2.  For Server Components, Next.js fetches data from Supabase (or Redis) on the server.
    3.  The server renders the HTML and sends it to the client.
    4.  For Client Components, the initial HTML is rendered, and then the browser fetches any required data from Supabase.
-   **SSR/SSG**: The application primarily uses Server-Side Rendering (SSR) by default with the App Router. There is no explicit use of Static Site Generation (SSG) found, but it could be implemented.
-   **Middleware**: No `middleware.ts` file was found at the root, but the server-side auth check in `app/protected/page.tsx` serves a similar purpose for that route.

## 6. 📈 Performance and Optimization

-   **Optimizations**:
    -   **Image Optimization**: `next/image` is used, with remote patterns configured for Supabase Storage, which helps in optimizing image delivery.
    -   **Lazy Loading**: Components are naturally code-split by Next.js.
    -   **Caching**: A strong Redis caching layer is in place, which, when fully implemented, will significantly reduce database load.
-   **Potential Bottlenecks**:
    -   **N+1 Queries**: In `BestsellersSection`, the code fetches a list of products and then makes a separate database call for each product to get the brand name. This should be refactored into a single query with a join.
    -   **Client-side Fetching**: Some sections on the homepage fetch data on the client (`BestsellersSection`), which can lead to layout shifts and a slower perceived load time. These could be converted to Server Components.

## 7. 🎨 UI/UX Review

-   **UI Structure**: The UI is built with a component-based architecture. Radix UI is used for accessible, unstyled primitives, and Tailwind CSS for styling. This is a modern and maintainable approach.
-   **Consistency**: The UI is consistent, using a shared set of components (`Card`, `Button`, etc.).
-   **Responsiveness**: The use of Tailwind CSS ensures the application is responsive. The `MobileMenu` component is a good example of adapting to different screen sizes.
-   **Suggestions**:
    -   **Loading States**: The `BestsellersSection` has a good loading skeleton. This pattern should be applied to all data-fetching components to improve UX.
    -   **Form Validation**: The `LoginForm` has basic validation, but more robust client-side and server-side validation would improve the user experience and security.

## 8. 💡 Recommended Improvements

-   **Refactor N+1 Queries**: Modify the Supabase query in `BestsellersSection` (and similar components) to join `products` and `brands` tables to avoid multiple database calls.
-   **Implement Caching Layer**: Fully integrate the `utils/cache.ts` abstraction layer. Convert components that fetch data client-side (like `BestsellersSection`) to Server Components that use `getOrSetCache`.
-   **Server Components**: Move data fetching from client-side `useEffect` hooks to Server Components where possible to improve performance and reduce client-side JavaScript.
-   **Use `React.memo`**: For expensive-to-render components that receive the same props often, consider wrapping them in `React.memo` to prevent unnecessary re-renders.
-   **Incremental Static Regeneration (ISR)**: For pages that don't need to be fully dynamic, consider using ISR to statically generate them at build time and revalidate them periodically.
-   **Remove Unused Code**: The `@types/ioredis` dependency is deprecated and can be removed, as `ioredis` now ships its own types.

## 9. ✅ Deployment Readiness

-   **Best Practices**: The code generally follows best practices for a Next.js application.
-   **Environment Variables**: The use of `.env` files for Supabase and Redis credentials is correct. `NEXT_PUBLIC_` prefixes are used appropriately for client-side variables.
-   **Build Process**: The `package.json` includes standard `build` and `start` scripts, making it easy to deploy on platforms like Vercel or a Node.js server.
-   **Linting and Formatting**: The project is set up with ESLint and Prettier, which helps maintain code quality. 