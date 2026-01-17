import React from 'react';
import ProductForm from '../Admin/ProductForm';

// Reuse ProductForm but point to seller endpoint via env var style prop
const SellerAddProduct = () => {
  // We'll monkey-patch fetch url by overriding window.__SELLER_CREATE__ that ProductForm reads
  // Instead, simpler: wrap and intercept axios in ProductForm via query param not available.
  // Alternative: Open ProductForm normally; server route checks role to choose store.
  // We can simply instruct users to use same form; but we'll embed as standalone.
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">เพิ่มสินค้าในร้านค้า</h1>
      <ProductForm 
        createEndpoint="/api/seller/product" 
        updateEndpointBase="/api/product" 
        onClose={() => window.history.back()} 
        onSuccess={() => window.history.back()} 
      />
    </div>
  );
};

export default SellerAddProduct;


