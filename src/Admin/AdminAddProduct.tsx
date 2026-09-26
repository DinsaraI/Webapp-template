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
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!image) {
      setErrorMessage('Choose a product image to upload.');
      return;
    }

    setLoading(true);
    try {
      await createProduct({
        title: title.trim(),
        price: Number(price),
        description: description.trim(),
        stock: Number(stock),
      }, image);
      setTitle('');
      setPrice('');
      setDescription('');
      setStock('0');
      setImage(null);
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
        Description
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} required rows={4} />
      </label>
      <label>
        Product image
        <input type="file" accept="image/*" onChange={(event) => setImage(event.target.files?.[0] ?? null)} required />
      </label>
      {errorMessage && <p className="admin-product-message error" role="alert">{errorMessage}</p>}
      {successMessage && <p className="admin-product-message success" role="status">{successMessage}</p>}
      <button type="submit" disabled={loading}>{loading ? 'Uploading...' : 'Upload product'}</button>
    </form>
  );
}
