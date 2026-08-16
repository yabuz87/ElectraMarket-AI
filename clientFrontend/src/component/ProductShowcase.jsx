"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Search,
  Contact,
  LayoutGrid,
  SlidersHorizontal,
  Sparkles,
  ThumbsUp,
  Users,
  X,
} from "lucide-react";
import Spinner from "./Spinner";
import { useProductData } from "../store/useProductStore";

const PRODUCTS_PER_PAGE = 8;
const defaultFilters = { q: "", category: "", minPrice: "", maxPrice: "", sort: "newest" };

export default function ProductShowcase({ initialCatalog = {} }) {
  const liveProducts = useProductData((state) => state.products);
  const liveTotalProducts = useProductData((state) => state.totalProducts);
  const liveCategories = useProductData((state) => state.categories);
  const isProductLoading = useProductData((state) => state.isProductLoading);
  const isSearching = useProductData((state) => state.isSearching);
  const fetchCategories = useProductData((state) => state.fetchCategories);
  const fetchFilteredProducts = useProductData((state) => state.fetchFilteredProducts);
  const [filters, setFilters] = useState(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [usingInitialCatalog, setUsingInitialCatalog] = useState(true);
  const catalogRef = useRef(null);
  const router = useRouter();
  const products = usingInitialCatalog ? (initialCatalog.products || []) : liveProducts;
  const totalProducts = usingInitialCatalog ? (initialCatalog.total || 0) : liveTotalProducts;
  const categories = liveCategories.length ? liveCategories : (initialCatalog.categories || []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchFilteredProducts({
        ...filters,
        q: filters.q.trim(),
        page: currentPage,
        limit: PRODUCTS_PER_PAGE,
      }).finally(() => setUsingInitialCatalog(false));
    }, filters.q ? 350 : 0);

    return () => window.clearTimeout(timer);
  }, [currentPage, fetchFilteredProducts, filters]);

  const totalPages = Math.max(Math.ceil(totalProducts / PRODUCTS_PER_PAGE), 1);
  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 4) return [1, 2, 3, 4, 5, "end-gap", totalPages];
    if (currentPage >= totalPages - 3) {
      return [1, "start-gap", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "start-gap", currentPage - 1, currentPage, currentPage + 1, "end-gap", totalPages];
  }, [currentPage, totalPages]);
  const activeFilterCount = useMemo(
    () => [filters.category, filters.minPrice, filters.maxPrice].filter(Boolean).length,
    [filters]
  );

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setCurrentPage(1);
  };

  const goToPage = (page) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    if (nextPage === currentPage) return;
    setCurrentPage(nextPage);
    window.requestAnimationFrame(() => {
      catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <main>
      <section className="store-hero">
        <div className="container store-hero__content">
          <div className="store-hero__copy">
            <span className="eyebrow"><Sparkles size={15} /> Smarter technology shopping</span>
            <h1>Discover the right tech.<br />Connect directly.</h1>
            <p>
              Browse local electronics listings, compare what matters, and contact product
              owners directly from any device.
            </p>
            <div className="d-flex flex-wrap gap-3">
              <button
                className="btn btn-brand btn-lg"
                onClick={() => catalogRef.current?.scrollIntoView({ behavior: "smooth" })}
              >
                Explore products <ChevronRight size={19} />
              </button>
              <button className="btn btn-soft btn-lg" onClick={() => router.push("/about")}>Our story</button>
            </div>
          </div>
          <div className="store-hero__visual" aria-hidden="true">
            <div className="hero-orbit hero-orbit--one" />
            <div className="hero-orbit hero-orbit--two" />
            <div className="hero-product-mark"><LayoutGrid size={54} /><span>Electra</span></div>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Marketplace benefits">
        <div className="container trust-strip__grid">
          <TrustItem icon={LayoutGrid} title="Public listings" text="Browse without signing in" />
          <TrustItem icon={Contact} title="Direct contact" text="Reach the product owner yourself" />
          <TrustItem icon={Bot} title="AI discovery help" text="Ask, search, and compare listings" />
        </div>
      </section>

      <section className="catalog-section container" ref={catalogRef}>
        <div className="catalog-heading">
          <div>
            <span className="eyebrow">Curated catalog</span>
            <h2>Browse the latest listings</h2>
          </div>
          <p>Search, narrow the selection, and sort products your way.</p>
        </div>

        <div className="catalog-toolbar">
          <div className="search-field">
            <Search size={19} aria-hidden="true" />
            <label className="visually-hidden" htmlFor="product-search">Search products</label>
            <input
              id="product-search"
              type="search"
              placeholder="Search products, models, or categories"
              value={filters.q}
              onChange={(event) => updateFilter("q", event.target.value)}
            />
            {filters.q && (
              <button aria-label="Clear search" onClick={() => updateFilter("q", "")}><X size={17} /></button>
            )}
          </div>
          <button className="btn btn-soft filter-toggle" onClick={() => setFiltersOpen((open) => !open)}>
            <SlidersHorizontal size={18} /> Filters
            {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
          </button>
          <label className="sort-select">
            <span>Sort by</span>
            <select value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)}>
              <option value="newest">Newest</option>
              <option value="popular">Most liked</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="name_asc">Name: A–Z</option>
            </select>
          </label>
        </div>

        <div className="catalog-layout">
          <FilterPanel
            categories={categories}
            filters={filters}
            open={filtersOpen}
            updateFilter={updateFilter}
            clearFilters={clearFilters}
          />

          <div className="catalog-results">
            <div className="results-meta" aria-live="polite">
              <span>
                {totalProducts > 0 ? (
                  <>Showing <strong>{(currentPage - 1) * PRODUCTS_PER_PAGE + 1}–{Math.min(currentPage * PRODUCTS_PER_PAGE, totalProducts)}</strong> of {totalProducts} products</>
                ) : (
                  <><strong>0</strong> products</>
                )}
              </span>
              {(filters.q || activeFilterCount > 0) && (
                <button onClick={clearFilters}>Clear all filters</button>
              )}
            </div>

            {(isProductLoading || isSearching) ? (
              <div className="catalog-loading"><Spinner /><span>Finding the best matches…</span></div>
            ) : products.length > 0 ? (
              <div className="product-grid">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    navigate={(path) => router.push(path)}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-catalog">
                <Search size={34} />
                <h3>No matching products</h3>
                <p>Try a broader search, another category, or a different price range.</p>
                <button className="btn btn-brand" onClick={clearFilters}>Reset filters</button>
              </div>
            )}

            {totalPages > 1 && (
              <nav className="store-pagination" aria-label="Product pages">
                <button
                  className="pagination-direction"
                  aria-label="Previous page"
                  disabled={currentPage === 1}
                  onClick={() => goToPage(currentPage - 1)}
                ><ChevronLeft size={18} /> Previous</button>
                <div className="pagination-pages">
                  {paginationItems.map((item) =>
                    typeof item === "string" ? (
                      <span className="pagination-gap" key={item} aria-hidden="true">…</span>
                    ) : (
                      <button
                        key={item}
                        className={item === currentPage ? "active" : ""}
                        aria-label={`Page ${item}`}
                        aria-current={item === currentPage ? "page" : undefined}
                        onClick={() => goToPage(item)}
                      >{item}</button>
                    )
                  )}
                </div>
                <span className="pagination-mobile-status">Page {currentPage} of {totalPages}</span>
                <button
                  className="pagination-direction"
                  disabled={currentPage >= totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                >Next <ChevronRight size={18} /></button>
              </nav>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function TrustItem({ icon: Icon, title, text }) {
  return <div className="trust-item"><span><Icon size={21} /></span><div><strong>{title}</strong><small>{text}</small></div></div>;
}

function FilterPanel({ categories, filters, open, updateFilter, clearFilters }) {
  return (
    <aside className={`filter-panel ${open ? "filter-panel--open" : ""}`}>
      <div className="filter-panel__header">
        <div><SlidersHorizontal size={18} /><strong>Filters</strong></div>
        <button onClick={clearFilters}>Reset</button>
      </div>
      <fieldset className="filter-group">
        <legend>Category</legend>
        <label className="filter-option">
          <input type="radio" name="category" checked={!filters.category} onChange={() => updateFilter("category", "")} />
          <span>All categories</span>
        </label>
        {categories.map((category) => (
          <label className="filter-option" key={category}>
            <input
              type="radio"
              name="category"
              checked={filters.category === category}
              onChange={() => updateFilter("category", category)}
            />
            <span>{category}</span>
          </label>
        ))}
      </fieldset>
      <fieldset className="filter-group">
        <legend>Price range <small>ETB</small></legend>
        <div className="price-range">
          <label><span>Minimum</span><input type="number" min="0" placeholder="0" value={filters.minPrice} onChange={(event) => updateFilter("minPrice", event.target.value)} /></label>
          <span aria-hidden="true">—</span>
          <label><span>Maximum</span><input type="number" min="0" placeholder="Any" value={filters.maxPrice} onChange={(event) => updateFilter("maxPrice", event.target.value)} /></label>
        </div>
      </fieldset>
    </aside>
  );
}

function ProductCard({ product, navigate }) {
  return (
    <article className="product-card" tabIndex="0" onClick={() => navigate(`/products/${product._id}`)} onKeyDown={(event) => event.key === "Enter" && navigate(`/products/${product._id}`)}>
      <ProductImageCarousel images={product.image || []} productName={product.name} />
      <div className="product-card__body">
        <span className="product-category">{product.category || "Electronics"}</span>
        <h3>{product.name}</h3>
        {product.model && <p className="product-model">{product.model}</p>}
        <div className="product-card__rating">
          <ThumbsUp size={15} /><span>{product.likes?.count || 0} likes</span>
          {product.salerId?.fullName && <><Users size={15} /><span>{product.salerId.fullName}</span></>}
        </div>
        <div className="product-card__footer">
          <div><span className="price-label">Price</span><strong>{formatPrice(product.price)}</strong></div>
          <button aria-label={`View ${product.name}`} onClick={(event) => { event.stopPropagation(); navigate(`/products/${product._id}`); }}><ChevronRight size={19} /><span>View</span></button>
        </div>
      </div>
    </article>
  );
}

function ProductImageCarousel({ images, productName }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const placeholder = "https://placehold.co/600x440/e9eef8/52617a?text=ElectraStore";
  const safeImages = images.filter((image) => image?.url);

  const changeImage = (event, direction) => {
    event.stopPropagation();
    setActiveIndex((index) => direction === "previous"
      ? (index === 0 ? safeImages.length - 1 : index - 1)
      : (index === safeImages.length - 1 ? 0 : index + 1));
  };

  return (
    <div className="product-card__media">
      <img src={safeImages[activeIndex]?.url || placeholder} alt={productName} loading="lazy" decoding="async" width="600" height="440" />
      <span className="stock-pill">Public listing</span>
      {safeImages.length > 1 && <div className="carousel-controls">
        <button onClick={(event) => changeImage(event, "previous")} aria-label="Previous image"><ChevronLeft size={18} /></button>
        <button onClick={(event) => changeImage(event, "next")} aria-label="Next image"><ChevronRight size={18} /></button>
      </div>}
    </div>
  );
}

const formatPrice = (price) => `${new Intl.NumberFormat("en-US").format(Number(price) || 0)} ETB`;
