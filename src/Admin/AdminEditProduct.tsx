import { useState, type FormEvent } from 'react';
import { updateProduct } from '../services/productService';
import { getFootwearSizeOptions, isFootwearCategory, normalizeProductCategory, PRODUCT_CATEGORIES, type Product, type ProductCategory, type ProductSizeSystem } from '../types/product';

const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

interface AdminEditProductProps {
  product: Product;
  onClose: () => void;
  onProductUpdated: (product: Product) => void;
}

export default function AdminEditProduct({ product, onClose, onProductUpdated }: AdminEditProductProps) {
  const initialCategory = normalizeProductCategory(product.category);
  const [title, setTitle] = useState(product.title);
  const [price, setPrice] = useState(String(product.price));
  const [category, setCategory] = useState<ProductCategory | ''>(initialCategory ?? '');
  const [sizeSystem, setSizeSystem] = useState<ProductSizeSystem>(product.size_system ?? 'US');
  const [tagsInput, setTagsInput] = useState((Array.isArray(product.tags) ? product.tags : (product.tags ?? '').split(/[|,]/)).join(', '));
  const [description, setDescription] = useState(product.description);
  const [stock, setStock] = useState(String(product.stock));
  const [imageUrls, setImageUrls] = useState([...new Set([product.image_url, ...(product.images ?? [])])].join('\n'));
  const [availableSizes, setAvailableSizes] = useState(initialCategory === 'bags' ? [] : (product.available_sizes ?? []));
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    const images = [...new Set(imageUrls.split(/\r?\n/).map((url) => url.trim()).filter(Boolean))];
    if (images.length === 0) {
      setErrorMessage('Add at least one image URL.');
      return;
    }
    if (!category) {
      setErrorMessage('Choose a product category.');
      return;
    }
    if (category !== 'bags' && availableSizes.length === 0) {
      setErrorMessage('Select at least one available size.');
      return;
    }
    if (!tagsInput.split(',').some((tag) => tag.trim())) {
      setErrorMessage('Enter at least one product tag.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateProduct(product.id, {
        title: title.trim(),
        price: Number(price),
        category,
        size_system: isFootwearCategory(category) ? sizeSystem : null,
        tags: [...new Set(tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean))],
        description: description.trim(),
        images,
        image_url: images[0],
        stock: Number(stock),
        available_sizes: availableSizes,
      });
      onProductUpdated(updated);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Product could not be updated.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-edit-backdrop" onClick={onClose}>
      <form className="admin-product-form admin-edit-modal" onClick={(event) => event.stopPropagation()} onSubmit={(event) => void handleSubmit(event)}>
        <header>
          <h2>Edit product</h2>
          <button type="button" className="admin-edit-close" onClick={onClose} aria-label="Close edit product">×</button>
        </header>
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={160} />
        </label>
        <div className="admin-product-form-row">
          <label>
            Price (LKR)
            <input type="number" value={price} onChange={(event) => setPrice(event.target.value)} min="0.01" step="0.01" required />
          </label>
          <label>
            Stock
            <input type="number" value={stock} onChange={(event) => setStock(event.target.value)} min="0" step="1" required />
          </label>
        </div>
        <label>
          Category
            <select value={category} onChange={(event) => {
              const nextCategory = event.target.value as ProductCategory | '';
              setCategory(nextCategory);
              setAvailableSizes(nextCategory === 'bags' || isFootwearCategory(nextCategory) ? [] : CLOTHING_SIZES);
            }} required>
              <option value="">Choose a category</option>
              {PRODUCT_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label>
          Tags (comma-separated)
          <input value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} placeholder="New, Trending, Sale" maxLength={200} required />
        </label>
        <label>
          Description
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} required rows={4} />
        </label>
        <label>
          Product image URLs (one per line; first is the primary image)
          <textarea value={imageUrls} onChange={(event) => setImageUrls(event.target.value)} required rows={4} />
        </label>
        {category !== 'bags' && (
          <>
            {isFootwearCategory(category) && (
              <label>
                Footwear sizing system
                <select value={sizeSystem} onChange={(event) => {
                  setSizeSystem(event.target.value as ProductSizeSystem);
                  setAvailableSizes([]);
                }}>
                  <option value="US">US sizes</option>
                  <option value="UK">UK sizes</option>
                </select>
              </label>
            )}
            <fieldset className="admin-product-sizes">
              <legend>Available {isFootwearCategory(category) ? `${sizeSystem} footwear sizes` : 'sizes'} (choose at least one)</legend>
              {(isFootwearCategory(category) && category
                ? getFootwearSizeOptions(category, sizeSystem)
                : CLOTHING_SIZES).map((size) => (
                <label key={size}>
                  <input
                    type="checkbox"
                    checked={availableSizes.includes(size)}
                    onChange={() => setAvailableSizes((current) => current.includes(size) ? current.filter((item) => item !== size) : [...current, size])}
                  />
                  {size}
                </label>
              ))}
            </fieldset>
          </>
        )}
        {category === 'bags' && <p>Bags do not use sizes.</p>}
        {errorMessage && <p className="admin-product-message error" role="alert">{errorMessage}</p>}
        <div className="admin-edit-actions">
          <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
        </div>
      </form>
    </div>
  );
}
