import { useState, useEffect } from 'react';
import { ProductCard } from './components/ProductCard';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductDetail } from './components/ProductDetail';
import { AdminPanel } from './components/AdminPanel';
import { Search, Settings } from 'lucide-react';
import * as api from '@/api';
import type { Product } from '@/api';
import { AdminLogin } from './components/AdminLogin';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['Todos']);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    Promise.all([api.getProducts(), api.getCategories()])
      .then(([prods, cats]) => {
        setProducts(prods);
        setCategories(cats);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateProducts = async (newProducts: Product[]) => {
    if (newProducts.length > products.length) {
      const created = newProducts.find((np) => !products.some((p) => p.id === np.id));
      if (created) {
        const { id: _clientId, ...data } = created;
        await api.createProduct(data);
      }
    } else if (newProducts.length < products.length) {
      const deleted = products.find((p) => !newProducts.some((np) => np.id === p.id));
      if (deleted) await api.deleteProduct(deleted.id);
    } else {
      const updated = newProducts.find((np) => {
        const old = products.find((p) => p.id === np.id);
        return old && JSON.stringify(old) !== JSON.stringify(np);
      });
      if (updated) {
        const { id, ...data } = updated;
        await api.updateProduct(id, data);
      }
    }
    const fresh = await api.getProducts();
    setProducts(fresh);
  };

  const handleUpdateCategories = async (newCategories: string[]) => {
    if (newCategories.length > categories.length) {
      const added = newCategories.find((c) => !categories.includes(c));
      if (added) await api.createCategory(added);
    } else {
      const removed = categories.find((c) => c !== 'Todos' && !newCategories.includes(c));
      if (removed) await api.deleteCategory(removed);
    }
    const fresh = await api.getCategories();
    setCategories(fresh);
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Título centrado con botón posicionado a la derecha */}
          <div className="relative flex items-center justify-center mb-2">
            <h1 className="text-lg sm:text-2xl text-center">Catálogo de Suplementos</h1>
            <button
              onClick={() => {
                if (sessionStorage.getItem('adminAuth') === '1') {
                  setShowAdmin(true);
                } else {
                  setShowLogin(true);
                }
              }}
              className="absolute right-0 flex items-center gap-1.5 bg-gray-800 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-900 text-sm"
            >
              <Settings size={16} />
              <span className="hidden sm:inline">Login</span>
            </button>
          </div>
          <p className="hidden sm:block text-center text-gray-600 mb-4 text-sm">
            Encuentra los mejores suplementos para tu rendimiento deportivo
          </p>
          <div className="relative max-w-md mx-auto mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {loading ? (
          <div className="text-center py-16 text-gray-500">Cargando productos...</div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} {...product} onClick={() => setSelectedProduct(product)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500">No se encontraron productos que coincidan con tu búsqueda.</p>
          </div>
        )}
      </main>

      {selectedProduct && (
        <ProductDetail product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      {showLogin && (
        <AdminLogin
          onSuccess={() => { setShowLogin(false); setShowAdmin(true); }}
          onClose={() => setShowLogin(false)}
        />
      )}

      {showAdmin && (
        <AdminPanel
          products={products}
          categories={categories}
          onUpdateProducts={handleUpdateProducts}
          onUpdateCategories={handleUpdateCategories}
          onClose={() => setShowAdmin(false)}
        />
      )}

      <footer className="bg-white mt-16 py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p>Todos nuestros productos son de la más alta calidad</p>
          <p className="mt-2">Envíos a todo el país • Pago seguro • Garantía de calidad</p>
        </div>
      </footer>
    </div>
  );
}
