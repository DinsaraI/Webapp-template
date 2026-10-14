export const PRODUCT_CATEGORIES = [
  { value: 'men', label: "Men's" },
  { value: 'women', label: "Women's" },
  { value: 'children', label: "Children's" },
  { value: 'bags', label: 'Bags' },
  { value: 'footwear-men', label: "Men's footwear" },
  { value: 'footwear-women', label: "Women's footwear" },
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]['value'];
export type ProductSizeSystem = 'US' | 'UK';

export function isFootwearCategory(category: ProductCategory | string | null | undefined): boolean {
  return category === 'footwear-men' || category === 'footwear-women';
}

export function getFootwearSizeOptions(category: ProductCategory, sizeSystem: ProductSizeSystem): string[] {
  const isMen = category === 'footwear-men';
  const firstSize = sizeSystem === 'US'
    ? (isMen ? 6 : 5)
    : (isMen ? 5 : 3);
  const lastSize = sizeSystem === 'US'
    ? (isMen ? 15 : 12)
    : (isMen ? 14 : 10);
  return Array.from({ length: (lastSize - firstSize) * 2 + 1 }, (_, index) => {
    const size = firstSize + index / 2;
    return Number.isInteger(size) ? String(size) : size.toFixed(1);
  });
}

export function normalizeProductCategory(category: string | null | undefined): ProductCategory | null {
  const normalized = category?.trim().toLocaleLowerCase().replace(/['’\s_-]/g, '');
  switch (normalized) {
    case 'men':
    case 'mens':
      return 'men';
    case 'woman':
    case 'women':
    case 'womens':
      return 'women';
    case 'child':
    case 'children':
    case 'childrens':
    case 'kids':
      return 'children';
    case 'bag':
    case 'bags':
      return 'bags';
    case 'footwearmen':
    case 'menfootwear':
    case 'mensfootwear':
    case 'menshoes':
      return 'footwear-men';
    case 'footwearwomen':
    case 'womenfootwear':
    case 'womensfootwear':
    case 'womenshoes':
      return 'footwear-women';
    default:
      return null;
  }
}

export interface Product {
  id: string;
  created_at: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  images: string[];
  available_sizes: string[];
  size_system?: ProductSizeSystem | null;
  is_archived?: boolean;
  stock: number;
  category?: string | null;
  tags?: string[] | string;
}

export interface NewProduct {
  title: string;
  description: string;
  price: number;
  stock: number;
  category: ProductCategory;
  tags: string[];
  available_sizes: string[];
  size_system: ProductSizeSystem | null;
}
