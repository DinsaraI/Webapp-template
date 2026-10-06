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
  category: string;
  tags: string[];
  available_sizes: string[];
}
