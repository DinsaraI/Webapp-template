import { supabase } from '../supabaseClient';
import { isFootwearCategory, normalizeProductCategory, type NewProduct, type Product, type ProductCategory } from '../types/product';

const PRODUCT_IMAGE_BUCKET = 'product-images';

function normalizeProductTags(tags: string[] | string | undefined): string[] {
  return [...new Set((Array.isArray(tags) ? tags : (tags ?? '').split(/[|,]/))
    .map((tag) => tag.trim())
    .filter(Boolean))];
}

function validateProductDetails(product: {
  title: string;
  description: string;
  price: number;
  stock: number;
  category?: string | null;
  tags?: string[] | string;
  available_sizes: string[];
  size_system?: string | null;
}): asserts product is typeof product & { category: ProductCategory } {
  if (!product.title.trim()) throw new Error('Enter a product title.');
  if (!product.description.trim()) throw new Error('Enter a product description.');
  if (!Number.isFinite(product.price) || product.price <= 0) throw new Error('Enter a price greater than zero.');
  if (!Number.isInteger(product.stock) || product.stock < 0) throw new Error('Enter a valid stock quantity.');
  const category = normalizeProductCategory(product.category);
  if (!category) throw new Error('Choose a valid product category.');
  if (normalizeProductTags(product.tags).length === 0) throw new Error('Enter at least one product tag.');
  if (!Array.isArray(product.available_sizes)) throw new Error('Product sizes must be a list.');
  if (category === 'bags') {
    if (product.available_sizes.length > 0 || product.size_system) {
      throw new Error('Bags do not have sizes or a sizing system.');
    }
  } else if (isFootwearCategory(category)) {
    if (product.size_system !== 'US' && product.size_system !== 'UK') {
      throw new Error('Choose US or UK sizing for footwear.');
    }
    if (product.available_sizes.length === 0 || product.available_sizes.some((size) => !/^[1-9]\d*(?:\.5)?$/.test(size))) {
      throw new Error('Select at least one valid numerical footwear size.');
    }
  } else if (product.available_sizes.length === 0) {
    throw new Error('Select at least one available size.');
  } else if (product.size_system) {
    throw new Error('US or UK sizing is only available for footwear.');
  }
}

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
  validateProductDetails(product);
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
        tags: normalizeProductTags(product.tags),
        image_url: imageUrls[0],
        images: imageUrls,
        category: product.category,
        size_system: product.size_system,
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
  updates: Pick<Product, 'title' | 'description' | 'price' | 'image_url' | 'images' | 'stock' | 'category' | 'tags' | 'available_sizes' | 'size_system'>,
): Promise<Product> {
  validateProductDetails(updates);
  const images = [...new Set(updates.images.map((image) => image.trim()).filter(Boolean))];
  const tags = normalizeProductTags(updates.tags);
  if (images.length === 0) throw new Error('Add at least one product image URL.');
  const { data, error } = await supabase
    .from('products')
    .update({
      ...updates,
      tags,
      images,
      image_url: images[0],
      category: updates.category,
      size_system: updates.size_system,
    })
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
