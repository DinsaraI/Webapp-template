export interface Product {
  id: string;
  created_at: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  category?: string;
  tags?: string[] | string;
}

export interface NewProduct {
  title: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
}
