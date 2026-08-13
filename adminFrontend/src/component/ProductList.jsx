import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ClipboardList, Pencil, Save, Trash2, X } from "lucide-react";
import Spinner from "./Spinner";
import { useProductData } from "../store/useProductData";
import { dateFormatter } from "../utils";

const PRODUCTS_PER_PAGE = 6;

export default function ProductList() {
  const products = useProductData((state) => state.products);
  const isProductLoading = useProductData((state) => state.isProductLoading);
  const deletingProductId = useProductData((state) => state.deletingProductId);
  const editingProductId = useProductData((state) => state.editingProductId);
  const fetchProductData = useProductData((state) => state.fetchProductData);
  const editProduct = useProductData((state) => state.editProduct);
  const deleteProduct = useProductData((state) => state.deleteProduct);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  useEffect(() => {
    if (!editingProduct) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !editingProductId) setEditingProduct(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [editingProduct, editingProductId]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      [product.name, product.model, product.category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

  useEffect(() => {
    const lastPage = Math.max(totalPages, 1);
    if (currentPage > lastPage) setCurrentPage(lastPage);
  }, [currentPage, totalPages]);

  const openEditor = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name || "",
      model: product.model || "",
      price: product.price ?? "",
      category: product.category || "",
    });
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editingProduct || !editForm) return;
    const succeeded = await editProduct(editingProduct._id, {
      ...editForm,
      name: editForm.name.trim(),
      model: editForm.model.trim(),
      category: editForm.category.trim(),
      price: Number(editForm.price),
    });
    if (succeeded) setEditingProduct(null);
  };

  const handleDeleteProduct = async (product) => {
    const confirmed = window.confirm(`Delete "${product.name}"? This action cannot be undone.`);
    if (confirmed) await deleteProduct(product._id);
  };

  if (isProductLoading) {
    return <div className="d-flex justify-content-center align-items-center py-5"><Spinner /></div>;
  }

  return (
    <section className="admin-product-page">
      <header className="admin-heading">
        <span>Catalog management</span>
        <h1 className="d-flex align-items-center gap-2"><ClipboardList aria-hidden="true" size={34} /> Your listings</h1>
        <p>Review, search, edit, and remove products published by your seller account.</p>
      </header>

      <div className="admin-product-search">
        <label className="visually-hidden" htmlFor="admin-product-search">Search products</label>
        <input
          id="admin-product-search"
          type="search"
          className="form-control"
          placeholder="Search by product name, model, or category..."
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className="row g-4">
        {currentProducts.length ? currentProducts.map((product) => (
          <div key={product._id} className="col-md-6 col-lg-4">
            <div className="card shadow-sm h-100 admin-product-card">
              <ProductImages product={product} />
              <div className="card-body d-flex flex-column">
                <h3 className="h5 card-title fw-bold text-dark">{product.name}</h3>
                <p className="card-text text-muted">Model: {product.model}</p>
                <p className="card-text">Category: <strong>{product.category}</strong></p>
                <p className="card-text">Condition: <strong>{product.spec?.condition || "Not specified"}</strong></p>
                <p className="card-text">Production date: <strong>{dateFormatter(product.productDate)}</strong></p>
                <p className="card-text text-success fw-semibold">Price: {product.price} ETB</p>
                <p className="card-text text-muted small">{product.views?.count || 0} views · {product.likes?.count || 0} likes · {product.commentCount || 0} comments</p>
                <div className="d-flex justify-content-between gap-2 mt-auto">
                  <button
                    className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
                    onClick={() => openEditor(product)}
                    disabled={Boolean(deletingProductId || editingProductId)}
                  >
                    <Pencil aria-hidden="true" size={15} /> Edit
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1"
                    onClick={() => handleDeleteProduct(product)}
                    disabled={Boolean(deletingProductId || editingProductId)}
                  >
                    {deletingProductId === product._id ? <Spinner /> : <Trash2 aria-hidden="true" size={15} />}
                    {deletingProductId === product._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <p className="text-center text-muted py-5">No products found.</p>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="admin-pagination d-flex justify-content-center align-items-center mt-4 gap-3" aria-label="Product pages">
          <button onClick={() => setCurrentPage((page) => page - 1)} className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1" disabled={currentPage === 1}>
            <ChevronLeft aria-hidden="true" size={16} /> Previous
          </button>
          <span className="fw-bold">Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage((page) => page + 1)} className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1" disabled={currentPage === totalPages}>
            Next <ChevronRight aria-hidden="true" size={16} />
          </button>
        </nav>
      )}

      {editingProduct && editForm && (
        <div className="modal d-block product-edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-product-title" onMouseDown={() => !editingProductId && setEditingProduct(null)}>
          <div className="modal-dialog modal-dialog-centered" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-content shadow-lg">
              <form onSubmit={handleEditSubmit}>
                <div className="modal-header">
                  <h2 className="modal-title fs-5" id="edit-product-title">Edit product</h2>
                  <button type="button" className="btn btn-sm btn-light" aria-label="Close editor" onClick={() => setEditingProduct(null)} disabled={Boolean(editingProductId)}>
                    <X aria-hidden="true" size={20} />
                  </button>
                </div>
                <div className="modal-body row g-3">
                  <EditField label="Name" name="name" value={editForm.name} setEditForm={setEditForm} />
                  <EditField label="Model" name="model" value={editForm.model} setEditForm={setEditForm} />
                  <EditField label="Price (ETB)" name="price" value={editForm.price} setEditForm={setEditForm} type="number" min="0" step="0.01" />
                  <EditField label="Category" name="category" value={editForm.category} setEditForm={setEditForm} />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setEditingProduct(null)} disabled={Boolean(editingProductId)}>Cancel</button>
                  <button type="submit" className="btn btn-primary d-inline-flex align-items-center gap-2" disabled={Boolean(editingProductId)}>
                    {editingProductId ? <Spinner /> : <Save aria-hidden="true" size={18} />}
                    {editingProductId ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function EditField({ label, name, value, setEditForm, type = "text", ...inputProps }) {
  const id = `edit-${name}`;
  return (
    <div className="col-12 col-sm-6">
      <label className="form-label" htmlFor={id}>{label}</label>
      <input id={id} name={name} type={type} className="form-control" value={value} onChange={(event) => setEditForm((current) => ({ ...current, [name]: event.target.value }))} required {...inputProps} />
    </div>
  );
}

function ProductImages({ product }) {
  const images = product.image || [];
  if (!images.length) return <div className="admin-product-placeholder d-flex align-items-center justify-content-center text-muted">No image</div>;
  return (
    <div id={`carousel-${product._id}`} className="carousel slide" data-bs-ride="carousel" data-bs-interval="3000">
      <div className="carousel-inner">
        {images.map((image, index) => (
          <div key={image.publicId || index} className={`carousel-item ${index === 0 ? "active" : ""}`}>
            <img src={image.url} className="d-block w-100" alt={`${product.name} ${index + 1}`} loading="lazy" decoding="async" />
          </div>
        ))}
      </div>
      {images.length > 1 && <>
        <button className="carousel-control-prev" type="button" data-bs-target={`#carousel-${product._id}`} data-bs-slide="prev" aria-label="Previous image"><span className="carousel-control-prev-icon" aria-hidden="true" /></button>
        <button className="carousel-control-next" type="button" data-bs-target={`#carousel-${product._id}`} data-bs-slide="next" aria-label="Next image"><span className="carousel-control-next-icon" aria-hidden="true" /></button>
      </>}
    </div>
  );
}
