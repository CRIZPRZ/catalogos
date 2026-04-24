import { supabase } from '@/lib/supabase';

export interface Product {
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

function fromDB(row: Record<string, unknown>): Product {
  const dbImages = (row.images as string[]) ?? [];
  const firstImage = (row.image as string) ?? '';
  const raw = dbImages.length ? dbImages : (firstImage ? [firstImage] : []);
  const images = [...new Set(raw.filter(Boolean))];
  return {
    id: row.id as number,
    name: row.name as string,
    category: row.category as string,
    price: row.price as number,
    image: images[0] ?? '',
    images,
    description: (row.description as string) ?? '',
    inStock: row.in_stock as boolean,
    detailedDescription: (row.detailed_description as string) ?? '',
    benefits: (row.benefits as string[]) ?? [],
    flavors: (row.flavors as string[]) ?? [],
    howToUse: (row.how_to_use as string) ?? '',
    ingredients: (row.ingredients as string) ?? '',
    servings: (row.servings as number) ?? 30,
    rating: (row.rating as number) ?? 5,
  };
}

function toDB(p: Omit<Product, 'id'>) {
  const raw = p.images?.length ? p.images : (p.image ? [p.image] : []);
  const images = [...new Set(raw.filter(Boolean))];
  return {
    name: p.name,
    category: p.category,
    price: p.price,
    image: images[0] ?? '',
    images,
    description: p.description,
    in_stock: p.inStock,
    detailed_description: p.detailedDescription ?? '',
    benefits: p.benefits ?? [],
    flavors: p.flavors ?? [],
    how_to_use: p.howToUse ?? '',
    ingredients: p.ingredients ?? '',
    servings: p.servings ?? 30,
    rating: p.rating ?? 5,
  };
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*').order('id');
  if (error) throw error;
  return (data ?? []).map(fromDB);
}

export async function createProduct(p: Omit<Product, 'id'>): Promise<Product> {
  const { data, error } = await supabase.from('products').insert(toDB(p)).select().single();
  if (error) throw error;
  return fromDB(data);
}

export async function updateProduct(id: number, p: Omit<Product, 'id'>): Promise<Product> {
  const { data, error } = await supabase.from('products').update(toDB(p)).eq('id', id).select().single();
  if (error) throw error;
  return fromDB(data);
}

export async function deleteProduct(id: number): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function getCategories(): Promise<string[]> {
  const { data, error } = await supabase.from('categories').select('name').order('name');
  if (error) throw error;
  return ['Todos', ...(data ?? []).map((r) => r.name as string)];
}

export async function createCategory(name: string): Promise<void> {
  const { error } = await supabase.from('categories').insert({ name });
  if (error) throw error;
}

export async function deleteCategory(name: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('name', name);
  if (error) throw error;
}

export async function uploadProductImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `products/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}
