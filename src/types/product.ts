export const PRODUCT_CATEGORIES = [
  { value: 'men', label: "Men's" },
  { value: 'women', label: "Women's" },
  { value: 'children', label: "Children's" },
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]['value'];

export function normalizeProductCategory(category: string | null | undefined): ProductCategory | null {
  switch (category?.trim().toLocaleLowerCase().replace(/['’\s]/g, '')) {
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
}
