// Export all database types
export * from './database';

// Re-export commonly used types
export type {
  Product,
  Category,
  Brand,
  ProductWithRelations,
  CategoryWithRelations,
  ProductFilters,
  CategoryFilters,
  ApiResponse,
  PaginatedResponse,
  CacheMetadata,
  ImageVariant,
  ProcessedImage,
} from './database'; 