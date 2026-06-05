import { useState } from 'react';
import { X, Star, Package, ShieldCheck, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={20} height={20}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const WHATSAPP_NUMBER = '527229056437';

interface ProductDetailProps {
  product: {
    id: number;
    name: string;
    category: string;
    price: number;
    image: string;
    images?: string[];
    description: string;
    inStock: boolean;
    detailedDescription?: string;
    importantInfo?: string;
    benefits?: string[];
    flavors?: string[];
    howToUse?: string;
    ingredients?: string;
    servings?: number;
    rating?: number;
  };
  onClose: () => void;
}

function ImageZoomModal({
  images,
  startIndex,
  onClose,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const prev = () => setIndex(i => (i - 1 + images.length) % images.length);
  const next = () => setIndex(i => (i + 1) % images.length);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex flex-col"
      onClick={onClose}
    >
      {/* top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <span className="text-white text-sm">
          {images.length > 1 ? `${index + 1} / ${images.length}` : ''}
        </span>
        <button onClick={onClose} className="text-white hover:text-gray-300 transition-colors">
          <X size={28} />
        </button>
      </div>

      {/* image */}
      <div
        className="flex-1 flex items-center justify-center relative min-h-0"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={images[index]}
          alt=""
          className="max-w-full max-h-full object-contain select-none"
          draggable={false}
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-2 transition-all"
            >
              <ChevronLeft size={28} className="text-white" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-2 transition-all"
            >
              <ChevronRight size={28} className="text-white" />
            </button>
          </>
        )}
      </div>

      {/* thumbnails */}
      {images.length > 1 && (
        <div
          className="flex gap-2 justify-center px-4 py-3 flex-shrink-0 overflow-x-auto"
          onClick={e => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                i === index ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-contain bg-white" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductDetail({ product, onClose }: ProductDetailProps) {
  const allImages = product.images?.length ? product.images : (product.image ? [product.image] : []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  const prev = () => setActiveIndex(i => (i - 1 + allImages.length) % allImages.length);
  const next = () => setActiveIndex(i => (i + 1) % allImages.length);

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hola, me interesa el producto: *${product.name}* - $${product.price.toFixed(2)}\n¿Podrías darme más información?`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
  };

  const PriceCTA = () => (
    <>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-gray-500">Precio</p>
          <p className="text-2xl font-bold text-gray-900">${product.price.toFixed(2)}</p>
        </div>
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {product.inStock ? 'En Stock' : 'Agotado'}
        </span>
      </div>
      <button
        onClick={handleWhatsApp}
        disabled={!product.inStock}
        className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-colors font-medium ${
          product.inStock
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        <WhatsAppIcon />
        {product.inStock ? 'Entrega inmediata por WhatsApp' : 'Realizar pedido'}
      </button>
    </>
  );

  return (
    <>
      {zoomOpen && (
        <ImageZoomModal
          images={allImages}
          startIndex={activeIndex}
          onClose={() => setZoomOpen(false)}
        />
      )}

      <div className="fixed inset-0 bg-black/50 z-50 flex flex-col md:block md:overflow-y-auto md:py-8 md:px-4">
        <div className="bg-white flex flex-col flex-1 min-h-0 md:block md:rounded-xl md:max-w-4xl md:mx-auto md:shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b flex-shrink-0 bg-white rounded-t-xl sticky top-0 z-10">
            <span className="text-sm text-blue-600 font-medium uppercase tracking-wide">
              {product.category}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Scrollable body (mobile) / normal flow (desktop) */}
          <div className="flex-1 min-h-0 overflow-y-auto md:overflow-visible">
            <div className="grid md:grid-cols-2 gap-4 md:gap-8 p-4 md:p-6">

              {/* Image / Carousel Section */}
              <div className="space-y-3">
                <div
                  className="relative h-56 sm:h-72 md:h-96 bg-white border border-gray-100 rounded-lg overflow-hidden cursor-zoom-in group"
                  onClick={() => setZoomOpen(true)}
                >
                  <ImageWithFallback
                    src={allImages[activeIndex] ?? ''}
                    alt={product.name}
                    className="w-full h-full object-contain p-2"
                  />

                  {/* zoom hint overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                    <div className="bg-white/90 rounded-full p-2 shadow-md">
                      <ZoomIn size={22} className="text-gray-700" />
                    </div>
                  </div>

                  {!product.inStock && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                      Agotado
                    </div>
                  )}

                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); prev(); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1 shadow transition-all"
                      >
                        <ChevronLeft size={20} className="text-gray-700" />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); next(); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1 shadow transition-all"
                      >
                        <ChevronRight size={20} className="text-gray-700" />
                      </button>
                    </>
                  )}
                </div>

                {/* zoom button (visible on touch devices where hover doesn't work) */}
                <button
                  onClick={() => setZoomOpen(true)}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors md:hidden"
                >
                  <ZoomIn size={14} />
                  Ver imagen ampliada
                </button>

                {allImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {allImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveIndex(i)}
                        className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                          i === activeIndex ? 'border-blue-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-90'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-contain bg-white" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex flex-col items-center text-center">
                    <ShieldCheck className="text-green-600 mb-1" size={22} />
                    <span className="text-xs text-gray-600">Producto Certificado</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <Package className="text-purple-600 mb-1" size={22} />
                    <span className="text-xs text-gray-600">{product.servings || 30} Porciones</span>
                  </div>
                </div>
              </div>

              {/* Details Section */}
              <div className="flex flex-col min-h-0">
                <div className="space-y-4 md:space-y-6 md:overflow-y-auto md:flex-1 md:max-h-[400px] pr-1 mb-4">
                  <div>
                    <h2 className="mb-2 uppercase">{product.name}</h2>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={i < (product.rating || 4) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">({product.rating || 4.5}/5)</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-2">Descripción</h3>
                      <p className="whitespace-pre-line text-gray-600 text-sm leading-relaxed">{product.description}</p>
                    </div>

                    {product.importantInfo && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <h3 className="mb-1 text-amber-900">Dato importante</h3>
                        <p className="whitespace-pre-line text-sm text-amber-800">{product.importantInfo}</p>
                      </div>
                    )}

                    {product.benefits && product.benefits.length > 0 && (
                      <div>
                        <h3 className="mb-2">Beneficios</h3>
                        <ul className="space-y-2">
                          {product.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="text-green-600 mt-0.5">✓</span>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {product.flavors && product.flavors.length > 0 && (
                      <div>
                        <h3 className="mb-3">Sabores disponibles</h3>
                        <div className="flex flex-wrap gap-2">
                          {product.flavors.map((flavor, index) => (
                            <span
                              key={index}
                              className="px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200"
                            >
                              {flavor}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {product.howToUse && (
                      <div>
                        <h3 className="mb-2">Modo de Uso</h3>
                        <p className="whitespace-pre-line text-gray-600 text-sm">{product.howToUse}</p>
                      </div>
                    )}

                    {product.ingredients && (
                      <div>
                        <h3 className="mb-2">Ingredientes</h3>
                        <p className="whitespace-pre-line text-gray-600 text-sm">{product.ingredients}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price/CTA — desktop only */}
                <div className="hidden md:block pt-4 border-t">
                  <PriceCTA />
                </div>
              </div>

            </div>
          </div>

          {/* Price/CTA — mobile only, pinned at bottom */}
          <div className="md:hidden flex-shrink-0 px-4 py-3 border-t bg-white">
            <PriceCTA />
          </div>

        </div>
      </div>
    </>
  );
}
