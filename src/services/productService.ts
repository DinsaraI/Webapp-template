import { supabase } from '../supabaseClient';
import type { NewProduct, Product } from '../types/product';

const PRODUCT_IMAGE_BUCKET = 'product-images';

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data ?? []) as Product[]).filter((product) => product.is_archived !== true);
}

export async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error?.code === 'PGRST116') return null;
  if (error) throw error;
  const product = data as Product;
  return product.is_archived === true ? null : product;
}

export async function createProduct(
  product: NewProduct,
  images: File[],
): Promise<Product> {
  if (images.length === 0) throw new Error('Choose at least one product image.');
  const uploadedPaths: string[] = [];

  try {
    const imageUrls: string[] = [];
    for (const [index, image] of images.entries()) {
      const imagePath = `products/${Date.now()}_${index}_${image.name}`;
      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .upload(imagePath, image, { upsert: false });
      if (uploadError) throw uploadError;
      uploadedPaths.push(imagePath);

      const { data: publicUrlData } = supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .getPublicUrl(imagePath);
      imageUrls.push(publicUrlData.publicUrl);
    }

    const { data, error: insertError } = await supabase
      .from('products')
      .insert({
        ...product,
        image_url: imageUrls[0],
        images: imageUrls,
        category: product.category.trim() || null,
      })
      .select('*')
      .single();

    if (insertError) throw insertError;
    return data as Product;
  } catch (error) {
    if (uploadedPaths.length > 0) {
      const { error: cleanupError } = await supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .remove(uploadedPaths);
      if (cleanupError) console.error('Unable to clean up uploaded product images:', cleanupError.message);
    }
    throw error;
  }
}

export async function updateProduct(
  productId: string,
  updates: Pick<Product, 'title' | 'description' | 'price' | 'image_url' | 'images' | 'stock' | 'category' | 'tags' | 'available_sizes'>,
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({ ...updates, category: updates.category?.trim() || null })
    .eq('id', productId)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error('Product was not updated. It may no longer exist or you may not have permission to manage it.');
  }
  return data as Product;
}

export async function deleteProduct(product: Product): Promise<void> {
  const { data, error } = await supabase
    .from('products')
    .update({ is_archived: true })
    .eq('id', product.id)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error('Product was not archived. It may no longer exist or you may not have permission to manage it.');
  }
}
