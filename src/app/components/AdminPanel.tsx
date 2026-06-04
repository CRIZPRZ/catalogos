import { useState } from 'react';
import { Plus, Edit, Trash2, X, Save, Upload, Crop } from 'lucide-react';
import { uploadProductImage } from '@/api';
import { processProductImage } from '@/lib/processProductImage';
import { ImageCropper } from './ImageCropper';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  images: string[];
  description: string;
  inStock: boolean;
  detailedDescription?: string;
  benefits?: string[];
  flavors?: string[];
  howToUse?: string;
  ingredients?: string;
  servings?: number;
  rating?: number;
}

interface AdminPanelProps {
  products: Product[];
  categories: string[];
  onUpdateProducts: (products: Product[]) => void;
  onUpdateCategories: (categories: string[]) => void;
  onClose: () => void;
}

interface ProductImageItem {
  id: string;
  kind: 'existing' | 'new';
  url: string;
  preview: string;
  file?: File;
}

function createImageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function AdminPanel({ products, categories, onUpdateProducts, onUpdateCategories, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageItems, setImageItems] = useState<ProductImageItem[]>([]);
  const [cropImageId, setCropImageId] = useState<string | null>(null);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: '',
    price: 0,
    image: '',
    images: [],
    description: '',
    inStock: true,
    draft: false,
    detailedDescription: '',
    benefits: [],
    flavors: [],
    howToUse: '',
    ingredients: '',
    servings: 30,
    rating: 5
  });

  const [benefitInput, setBenefitInput] = useState('');
  const [flavorInput, setFlavorInput] = useState('');

  const releaseImagePreview = (item: ProductImageItem) => {
    if (item.kind === 'new') {
      URL.revokeObjectURL(item.preview);
    }
  };

  const replaceImageItems = (nextItems: ProductImageItem[]) => {
    setImageItems(prev => {
      prev.forEach(item => {
        if (!nextItems.some(next => next.id === item.id)) {
          releaseImagePreview(item);
        }
      });
      return nextItems;
    });
  };

  const clearImageItems = () => {
    setImageItems(prev => {
      prev.forEach(releaseImagePreview);
      return [];
    });
  };

  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    const processed = await Promise.all(files.map(f => processProductImage(f)));
    const entries = processed.map(file => {
      const preview = URL.createObjectURL(file);
      return {
        id: createImageId(),
        kind: 'new' as const,
        url: preview,
        preview,
        file,
      };
    });
    setImageItems(prev => [...prev, ...entries]);
  };

  const removeImage = (id: string) => {
    replaceImageItems(imageItems.filter(item => item.id !== id));
    if (cropImageId === id) setCropImageId(null);
    if (draggedImageId === id) setDraggedImageId(null);
  };

  const handleCropComplete = (id: string, file: File) => {
    const nextPreview = URL.createObjectURL(file);
    setImageItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      releaseImagePreview(item);
      return {
        ...item,
        url: nextPreview,
        preview: nextPreview,
        file,
      };
    }));
    setCropImageId(null);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    replaceImageItems((product.images?.length ? product.images : (product.image ? [product.image] : [])).map((src) => ({
      id: createImageId(),
      kind: 'existing' as const,
      url: src,
      preview: src,
    })));
    setShowProductForm(true);
  };

  const handleDeleteProduct = (id: number) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      onUpdateProducts(products.filter(p => p.id !== id));
    }
  };

  const handleSaveProduct = async () => {
    if (formData.draft) {
      if (imageItems.length === 0) {
        alert('Un borrador requiere al menos una foto');
        return;
      }
    } else {
      const missing: string[] = [];
      if (!formData.name) missing.push('nombre');
      if (!formData.category) missing.push('categoría');
      if (!formData.price) missing.push('precio');
      if (imageItems.length === 0) missing.push('al menos una foto');
      if (!formData.description) missing.push('descripción');
      if (!formData.howToUse) missing.push('modo de uso');
      if (!formData.ingredients) missing.push('ingredientes');
      if (!formData.benefits?.length) missing.push('al menos un beneficio');
      if (!formData.flavors?.length) missing.push('al menos un sabor');
      if (missing.length > 0) {
        alert(`Faltan los siguientes campos:\n• ${missing.join('\n• ')}`);
        return;
      }
    }

    setUploading(true);
    let finalImages: string[] = [];
    try {
      finalImages = await Promise.all(imageItems.map(async (item) => {
        if (item.kind === 'existing') return item.url;
        return uploadProductImage(item.file!);
      }));
    } finally {
      setUploading(false);
    }
    const productData = { ...formData, images: finalImages, image: finalImages[0] ?? '' };

    if (editingProduct) {
      onUpdateProducts(products.map(p => p.id === editingProduct.id ? { ...productData, id: p.id } as Product : p));
    } else {
      const newId = Math.max(0, ...products.map(p => p.id)) + 1;
      onUpdateProducts([...products, { ...productData, id: newId } as Product]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      price: 0,
      image: '',
      images: [],
      description: '',
      inStock: true,
      draft: false,
      detailedDescription: '',
      benefits: [],
      flavors: [],
      howToUse: '',
      ingredients: '',
      servings: 30,
      rating: 5
    });
    setBenefitInput('');
    setFlavorInput('');
    clearImageItems();
    setEditingProduct(null);
    setShowProductForm(false);
    setCropImageId(null);
    setDraggedImageId(null);
  };

  const handleAddBenefit = () => {
    if (benefitInput.trim()) {
      setFormData({ ...formData, benefits: [...(formData.benefits || []), benefitInput.trim()] });
      setBenefitInput('');
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData({ ...formData, benefits: formData.benefits?.filter((_, i) => i !== index) || [] });
  };

  const handleAddFlavor = () => {
    if (flavorInput.trim()) {
      setFormData({ ...formData, flavors: [...(formData.flavors || []), flavorInput.trim()] });
      setFlavorInput('');
    }
  };

  const handleRemoveFlavor = (index: number) => {
    setFormData({ ...formData, flavors: formData.flavors?.filter((_, i) => i !== index) || [] });
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      onUpdateCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleDeleteCategory = (category: string) => {
    if (confirm(`¿Eliminar la categoría "${category}"? Los productos con esta categoría mantendrán su categoría actual.`)) {
      onUpdateCategories(categories.filter(c => c !== category));
    }
  };

  const moveImage = (fromId: string, toId: string) => {
    if (fromId === toId) return;

    setImageItems(prev => {
      const fromIndex = prev.findIndex(item => item.id === fromId);
      const toIndex = prev.findIndex(item => item.id === toId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleTouchStart = (id: string, e: React.TouchEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, input, label')) return;
    setDraggedImageId(id);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!draggedImageId) return;

    const touch = e.touches[0];
    if (!touch) return;

    const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const dropTarget = target?.closest<HTMLElement>('[data-image-id]');
    const targetId = dropTarget?.dataset.imageId;

    if (targetId && targetId !== draggedImageId) {
      moveImage(draggedImageId, targetId);
    }

    e.preventDefault();
  };

  const handleTouchEnd = () => {
    setDraggedImageId(null);
  };

  const cropTarget = cropImageId ? imageItems.find(item => item.id === cropImageId && item.kind === 'new') : null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 overflow-y-auto">
      <div className="min-h-screen p-2 sm:p-4">
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-2xl my-4 sm:my-8">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b">
            <h2>Panel Administrativo</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 text-sm sm:text-base ${activeTab === 'products' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              Productos
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 text-sm sm:text-base ${activeTab === 'categories' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              Categorías
            </button>
          </div>

          <div className="p-3 sm:p-6">
            {activeTab === 'products' && (
              <div>
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h3>Gestión de Productos ({products.length})</h3>
                  <button
                    onClick={() => { resetForm(); setShowProductForm(true); }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 text-sm sm:text-base"
                  >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Nuevo Producto</span>
                    <span className="sm:hidden">Nuevo</span>
                  </button>
                </div>

                {showProductForm && (<>
                  <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl">

                      {/* Header */}
                      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b flex-shrink-0">
                        <h3 className="font-semibold text-gray-800">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                        <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                      </div>

                      {/* Scrollable body */}
                      <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4">

                        {/* Nombre + Categoría */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
                            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Categoría *</label>
                            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                              <option value="">Seleccionar...</option>
                              {categories.filter(c => c !== 'Todos').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                          </div>
                        </div>

                        {/* Borrador */}
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-yellow-400 bg-yellow-50 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!!formData.draft}
                            onChange={(e) => setFormData({ ...formData, draft: e.target.checked })}
                            className="w-4 h-4 accent-yellow-500"
                          />
                          <div>
                            <span className="text-sm font-medium text-yellow-800">Guardar como borrador</span>
                            <p className="text-xs text-yellow-700">No se mostrará en el catálogo. Solo requiere al menos una foto.</p>
                          </div>
                        </label>

                        {/* Precio + Porciones + Rating + Stock */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Precio *</label>
                            <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Porciones</label>
                            <input type="number" value={formData.servings} onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Rating (1-5)</label>
                            <input type="number" min="1" max="5" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">En Stock</label>
                            <select value={formData.inStock ? 'true' : 'false'} onChange={(e) => setFormData({ ...formData, inStock: e.target.value === 'true' })} className="w-full px-3 py-2 border rounded-lg text-sm">
                              <option value="true">Sí</option>
                              <option value="false">No</option>
                            </select>
                          </div>
                        </div>

                        {/* Imágenes */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Imágenes</label>
                          <p className="text-xs text-gray-400 mb-2">Tamaño ideal: <strong>1000×1000 px</strong> cuadrada, fondo blanco, formato JPG/PNG. La primera imagen aparece en la tarjeta. Puedes arrastrarlas para cambiar el orden.</p>
                          <div className="flex flex-wrap gap-2">
                            {imageItems.map((item, i) => (
                              <div
                                key={item.id}
                                data-image-id={item.id}
                                draggable
                                onDragStart={() => setDraggedImageId(item.id)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => {
                                  if (draggedImageId) {
                                    moveImage(draggedImageId, item.id);
                                    setDraggedImageId(null);
                                  }
                                }}
                                onDragEnd={() => setDraggedImageId(null)}
                                onTouchStart={(e) => handleTouchStart(item.id, e)}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                onTouchCancel={handleTouchEnd}
                                className={`relative w-16 h-16 flex-shrink-0 rounded-lg border bg-white cursor-move overflow-visible ${
                                  draggedImageId === item.id ? 'opacity-60 border-blue-400' : item.kind === 'new' ? 'border-blue-300' : 'border-gray-200'
                                }`}
                                style={{ touchAction: 'none' }}
                                title={`Imagen ${i + 1}`}
                              >
                                <img src={item.preview} alt="" className="w-full h-full object-cover rounded-lg" />
                                <div className="absolute left-1 top-1 rounded bg-black/65 px-1 py-0.5 text-[10px] text-white">
                                  {i + 1}
                                </div>
                                {item.kind === 'new' && (
                                  <button
                                    type="button"
                                    onClick={() => setCropImageId(item.id)}
                                    className="absolute bottom-0 left-0 bg-blue-600 text-white rounded-tr-lg px-1.5 py-1 hover:bg-blue-700 z-10"
                                    title="Recortar"
                                  >
                                    <Crop size={12} />
                                  </button>
                                )}
                                <button type="button" onClick={() => removeImage(item.id)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-600 z-10">
                                  <X size={10} />
                                </button>
                              </div>
                            ))}
                            <label className="w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors flex-shrink-0">
                              <Upload size={16} className="text-gray-400 mb-0.5" />
                              <span className="text-xs text-gray-400">Agregar</span>
                              <input type="file" accept="image/*" multiple onChange={handleImagesChange} className="hidden" />
                            </label>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {imageItems.filter(item => item.kind === 'new').map((item) => (
                              <button
                                key={`${item.id}-crop-button`}
                                type="button"
                                onClick={() => setCropImageId(item.id)}
                                className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100"
                              >
                                <Crop size={12} />
                                Recortar imagen {imageItems.findIndex(current => current.id === item.id) + 1}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Descripción */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Descripción</label>
                          <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows={3} />
                        </div>

                        {/* Modo de uso + Ingredientes lado a lado */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Modo de Uso</label>
                            <textarea value={formData.howToUse} onChange={(e) => setFormData({ ...formData, howToUse: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Ingredientes</label>
                            <textarea value={formData.ingredients} onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
                          </div>
                        </div>

                        {/* Beneficios + Sabores lado a lado */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Beneficios</label>
                            <div className="flex gap-1.5 mb-2">
                              <input type="text" value={benefitInput} onChange={(e) => setBenefitInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddBenefit()} className="flex-1 px-2 py-1.5 border rounded-lg text-sm" placeholder="Agregar..." />
                              <button type="button" onClick={handleAddBenefit} className="bg-gray-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-gray-700"><Plus size={16} /></button>
                            </div>
                            <div className="space-y-1 max-h-28 overflow-y-auto">
                              {formData.benefits?.map((benefit, index) => (
                                <div key={index} className="flex items-center gap-1.5 bg-gray-50 border px-2 py-1 rounded text-sm">
                                  <span className="flex-1 text-xs">{benefit}</span>
                                  <button type="button" onClick={() => handleRemoveBenefit(index)} className="text-red-400 hover:text-red-600"><X size={13} /></button>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Sabores</label>
                            <div className="flex gap-1.5 mb-2">
                              <input type="text" value={flavorInput} onChange={(e) => setFlavorInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddFlavor()} className="flex-1 px-2 py-1.5 border rounded-lg text-sm" placeholder="Ej: Chocolate..." />
                              <button type="button" onClick={handleAddFlavor} className="bg-gray-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-gray-700"><Plus size={16} /></button>
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                              {formData.flavors?.map((flavor, index) => (
                                <span key={index} className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full text-xs">
                                  {flavor}
                                  <button type="button" onClick={() => handleRemoveFlavor(index)} className="hover:text-purple-600"><X size={12} /></button>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Footer */}
                      <div className="flex gap-3 px-4 sm:px-6 py-4 border-t flex-shrink-0 bg-gray-50 rounded-b-xl">
                        <button onClick={handleSaveProduct} disabled={uploading} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-60 text-sm">
                          <Save size={16} />
                          {uploading ? 'Subiendo...' : 'Guardar'}
                        </button>
                        <button onClick={resetForm} className="flex-1 sm:flex-none bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-300 text-sm text-center">
                          Cancelar
                        </button>
                      </div>

                    </div>
                  </div>

                  {cropTarget && cropTarget.file && (
                    <ImageCropper
                      imageUrl={cropTarget.preview}
                      fileName={cropTarget.file.name}
                      onCropComplete={(file) => handleCropComplete(cropTarget.id, file)}
                      onCancel={() => setCropImageId(null)}
                    />
                  )}
                </>)}

                <div className="grid gap-3">
                  {products.map(product => (
                    <div key={product.id} className="flex items-center gap-3 bg-white border rounded-lg p-3 hover:shadow-md transition-shadow">
                      <img src={product.image} alt={product.name} className="w-14 h-14 sm:w-20 sm:h-20 object-cover rounded flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-sm sm:text-base truncate">{product.name || <span className="text-gray-400 italic">Sin nombre</span>}</h4>
                          {product.draft && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-300 px-2 py-0.5 rounded-full flex-shrink-0">Borrador</span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">{product.category || '—'} — ${product.price?.toFixed(2) ?? '0.00'}</p>
                        <p className="text-xs text-gray-400">{product.inStock ? 'En stock' : 'Agotado'}</p>
                      </div>
                      <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                        <button onClick={() => handleEditProduct(product)} className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'categories' && (
              <div>
                <h3 className="mb-6">Gestión de Categorías</h3>
                <div className="bg-gray-50 p-4 sm:p-6 rounded-lg mb-6">
                  <label className="block text-sm mb-2">Nueva Categoría</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      placeholder="Nombre de la categoría..."
                    />
                    <button onClick={handleAddCategory} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm">
                      Agregar
                    </button>
                  </div>
                </div>
                <div className="grid gap-3">
                  {categories.filter(c => c !== 'Todos').map(category => (
                    <div key={category} className="flex items-center justify-between bg-white border rounded-lg p-4">
                      <span>{category}</span>
                      <button onClick={() => handleDeleteCategory(category)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
