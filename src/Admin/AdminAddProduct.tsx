import { useRef, useState, type FormEvent } from 'react';
import { createProduct } from '../services/productService';

interface AdminAddProductProps {
  onProductAdded: () => void;
}

export default function AdminAddProduct({ onProductAdded }: AdminAddProductProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('0');
  const [images, setImages] = useState<File[]>([]);
  const [category, setCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [availableSizes, setAvailableSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (images.length === 0) {
      setErrorMessage('Choose at least one product image to upload.');
      return;
    }
    if (availableSizes.length === 0) {
      setErrorMessage('Select at least one available size.');
      return;
    }

    setLoading(true);
    try {
      await createProduct({
        title: title.trim(),
        price: Number(price),
        description: description.trim(),
        stock: Number(stock),
        category: category.trim(),
        tags: [...new Set(tagsInput.split(',').map((tag) => tag.trim()).filter(Boolean))],
        available_sizes: availableSizes,
      }, images);
      setTitle('');
      setPrice('');
      setDescription('');
      setStock('0');
      setImages([]);
      setCategory('');
      setTagsInput('');
      setAvailableSizes(['S', 'M', 'L', 'XL']);
      formRef.current?.reset();
      setSuccessMessage('Product added.');
      onProductAdded();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Product upload failed. Check your admin access and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form ref={formRef} className="admin-product-form" onSubmit={handleSubmit}>
      <h2>Add product</h2>
      <label>
        Title
        <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={160} />
      </label>
      <div className="admin-product-form-row">
        <label>
          Price (LKR)
          <input type="number" value={price} onChange={(event) => setPrice(event.target.value)} min="0" step="0.01" required />
        </label>
        <label>
          Stock
          <input type="number" value={stock} onChange={(event) => setStock(event.target.value)} min="0" step="1" required />
        </label>
      </div>
      <label>
        Category
        <input value={category} onChange={(event) => setCategory(event.target.value)} maxLength={80} />
      </label>
      <label>
        Tags (comma-separated)
        <input value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} placeholder="New, Trending, Sale" maxLength={200} />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} required rows={4} />
      </label>
      <label>
        Product images
        <input type="file" accept="image/*" multiple onChange={(event) => setImages(Array.from(event.target.files ?? []))} required />
      </label>
      <fieldset className="admin-product-sizes">
        <legend>Available sizes</legend>
        {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
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
      {errorMessage && <p className="admin-product-message error" role="alert">{errorMessage}</p>}
      {successMessage && <p className="admin-product-message success" role="status">{successMessage}</p>}
      <button type="submit" disabled={loading}>{loading ? 'Uploading...' : 'Upload product'}</button>
    </form>
  );
}
