import { supabase } from '../supabaseClient';
import type { NewProduct, Product } from '../types/product';

const PRODUCT_IMAGE_BUCKET = 'product-images';

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error?.code === 'PGRST116') return null;
  if (error) throw error;
  return data as Product;
}

export async function createProduct(
  product: Omit<NewProduct, 'image_url'>,
  image: File,
): Promise<Product> {
  const imagePath = `products/${Date.now()}_${image.name}`;
  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(imagePath, image, { upsert: false });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .getPublicUrl(imagePath);

  const { data, error: insertError } = await supabase
    .from('products')
    .insert({ ...product, image_url: publicUrlData.publicUrl })
    .select('*')
    .single();

  if (insertError) {
    await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([imagePath]);
    throw insertError;
  }

  return data as Product;
}

function getProductImagePath(imageUrl: string): string | null {
  const publicPath = '/storage/v1/object/public/product-images/';
  try {
    const path = new URL(imageUrl).pathname;
    const markerIndex = path.indexOf(publicPath);
    return markerIndex < 0
      ? null
      : decodeURIComponent(path.slice(markerIndex + publicPath.length));
  } catch {
    return null;
  }
}

export async function deleteProduct(product: Product): Promise<void> {
  const imagePath = getProductImagePath(product.image_url);

  if (imagePath) {
    const { error: storageError } = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .remove([imagePath]);
    if (storageError) throw storageError;
  }

  const { error } = await supabase.from('products').delete().eq('id', product.id);
  if (error) throw error;
}
