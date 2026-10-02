import { useEffect, useState } from 'react';
import { Activity, ArrowDownToLine, ArrowRight, Boxes, CirclePlus, LogOut, Package, Pencil, Search, ShieldCheck, Trash2, X } from 'lucide-react';
import { clearSession, login, logout, productsApi, readSession, register } from './api.js';

const emptyProduct = { product_name: '', description: '', price: '', quantity: '' };
const money = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const session = mode === 'login' ? await login(form) : await register(form);
      onAuthenticated(session);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-art" aria-label="Stockroom inventory">
        <div className="brand-lockup"><span className="brand-mark"><Boxes size={19} /></span><span>stockroom</span></div>
        <div className="art-copy">
          <span className="eyebrow">INVENTORY / CONTROL</span>
          <h1>Know what<br />you have.</h1>
          <p>A clear view of every item, every count, every day.</p>
        </div>
        <div className="shelf-graphic" aria-hidden="true">
          <div className="shelf shelf-one"><i /><i /><i /><i /></div>
          <div className="shelf shelf-two"><i /><i /><i /></div>
          <div className="shelf shelf-three"><i /><i /><i /><i /><i /></div>
          <div className="shelf-line" />
        </div>
        <span className="art-index">SR / 06 — 2026</span>
      </section>
      <section className="auth-form-side">
        <div className="auth-topline"><span>PRODUCT MANAGEMENT</span><span>01 / 02</span></div>
        <div className="auth-card">
          <div className="mobile-brand"><span className="brand-mark"><Boxes size={18} /></span> stockroom</div>
          <span className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'NEW WORKSPACE'}</span>
          <h2>{mode === 'login' ? 'Sign in to continue' : 'Create your account'}</h2>
          <p className="auth-intro">{mode === 'login' ? 'Use your account details to open the inventory.' : 'Set up the first account for your inventory workspace.'}</p>
          <form onSubmit={submit} className="auth-fields">
            <label>{mode === 'login' ? 'Username or email' : 'Username'}
              <input required autoComplete="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder={mode === 'login' ? 'you@company.com' : 'Choose a username'} />
            </label>
            {mode === 'register' && <label>Email address<input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@company.com" /></label>}
            <label>Password<input required type="password" minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-dark auth-submit" disabled={busy} type="submit">{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}<ArrowRight size={17} /></button>
          </form>
          <p className="auth-switch">{mode === 'login' ? 'First time here?' : 'Already have an account?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}> {mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
        </div>
        <div className="auth-footer"><span><ShieldCheck size={14} /> SECURE SESSION</span><span>STOCKROOM SYSTEMS</span></div>
      </section>
    </main>
  );
}

function ProductDialog({ product, onClose, onSave }) {
  const [form, setForm] = useState(product ? { ...product } : emptyProduct);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSave({ ...form, price: Number(form.price), quantity: Number(form.quantity) });
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <header className="dialog-head"><div><span className="eyebrow">PRODUCT RECORD</span><h2 id="dialog-title">{product ? 'Edit product' : 'Add a product'}</h2></div><button className="icon-button" title="Close" aria-label="Close dialog" onClick={onClose}><X size={19} /></button></header>
      <form onSubmit={submit} className="product-form">
        <label className="field-wide">Product name<input required maxLength={100} autoFocus value={form.product_name} onChange={(event) => setForm({ ...form, product_name: event.target.value })} placeholder="e.g. Studio headphones" /></label>
        <label className="field-wide">Description<textarea rows="3" value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Material, size, or other details" /></label>
        <label>Price<input required type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="0.00" /></label>
        <label>Quantity<input required type="number" min="0" step="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} placeholder="0" /></label>
        {error && <p className="form-error field-wide" role="alert">{error}</p>}
        <div className="dialog-actions field-wide"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-dark" disabled={busy}>{busy ? 'Saving…' : product ? 'Save changes' : 'Add product'}</button></div>
      </form>
    </section>
  </div>;
}

function App() {
  const [session, setSession] = useState(() => readSession());
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [dialogProduct, setDialogProduct] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadProducts() {
    setLoading(true);
    setError('');
    try {
      const result = await productsApi.list();
      setProducts(Array.isArray(result) ? result : result.products || []);
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.status === 401) {
        clearSession();
        setSession(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (session) loadProducts(); }, [session]);

  async function saveProduct(payload) {
    if (dialogProduct) await productsApi.update(dialogProduct.id, payload);
    else await productsApi.create(payload);
    setDialogProduct(undefined);
    setNotice(dialogProduct ? 'Product updated.' : 'Product added.');
    await loadProducts();
  }

  async function removeProduct(product) {
    if (!window.confirm(`Delete “${product.product_name}”? This cannot be undone.`)) return;
    setError('');
    try {
      await productsApi.remove(product.id);
      setProducts((items) => items.filter((item) => item.id !== product.id));
      setNotice('Product deleted.');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function signOut() {
    await logout().catch(() => clearSession());
    setSession(null);
    setProducts([]);
  }

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (!session) return <AuthScreen onAuthenticated={setSession} />;

  const filteredProducts = products.filter((product) => `${product.product_name} ${product.description || ''}`.toLowerCase().includes(query.toLowerCase()));
  const inventoryValue = products.reduce((sum, product) => sum + Number(product.price) * Number(product.quantity), 0);
  const lowStock = products.filter((product) => Number(product.quantity) < 5).length;

  return <div className="app-shell">
    <aside className="sidebar">
      <a href="#inventory" className="brand-lockup"><span className="brand-mark"><Boxes size={18} /></span><span>stockroom</span></a>
      <div className="side-caption">WORKSPACE</div>
      <a className="side-link active" href="#inventory"><Package size={17} /> Products <span className="side-count">{products.length}</span></a>
      <div className="sidebar-bottom"><div className="user-block"><span className="avatar">{(session.user?.username || session.user?.email || 'U').slice(0, 1).toUpperCase()}</span><div className="user-copy"><strong>{session.user?.username || 'Account'}</strong><span>Inventory manager</span></div></div><button className="side-logout" onClick={signOut}><LogOut size={16} /> Sign out</button></div>
    </aside>
    <main className="main-content" id="inventory">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>Products</strong></div><div className="topbar-meta"><span className="live-dot" /> SYSTEM ONLINE <span className="topbar-date">{new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date())}</span></div></header>
      <section className="page-heading"><div><span className="eyebrow">CATALOG / OVERVIEW</span><h1>Product inventory</h1><p>Keep your catalog and stock levels up to date.</p></div><button className="button button-accent" onClick={() => setDialogProduct(null)}><CirclePlus size={17} /> Add product</button></section>
      <section className="metrics" aria-label="Inventory summary">
        <article className="metric metric-primary"><span className="metric-label">TOTAL PRODUCTS <Package size={16} /></span><strong>{products.length.toString().padStart(2, '0')}</strong><span className="metric-foot">Unique catalog items</span></article>
        <article className="metric"><span className="metric-label">UNITS IN STOCK <Boxes size={16} /></span><strong>{products.reduce((sum, product) => sum + Number(product.quantity), 0).toLocaleString()}</strong><span className="metric-foot">Across all products</span></article>
        <article className="metric"><span className="metric-label">INVENTORY VALUE <Activity size={16} /></span><strong className="metric-money">{money.format(inventoryValue)}</strong><span className="metric-foot">Based on current quantity</span></article>
        <article className={`metric ${lowStock ? 'metric-warning' : ''}`}><span className="metric-label">LOW STOCK <ArrowDownToLine size={16} /></span><strong>{lowStock.toString().padStart(2, '0')}</strong><span className="metric-foot">Below 5 units</span></article>
      </section>
      <section className="catalog-section">
        <div className="catalog-heading"><div><h2>All products <span>{products.length}</span></h2><p>Manage product details and available quantities.</p></div><label className="search-box"><Search size={17} /><input aria-label="Search products" placeholder="Search products…" value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button title="Clear search" aria-label="Clear search" onClick={() => setQuery('')}><X size={15} /></button>}</label></div>
        {error && <div className="notice notice-error" role="alert">{error}<button onClick={() => setError('')} title="Dismiss" aria-label="Dismiss"><X size={15} /></button></div>}
        {notice && <div className="notice notice-success" role="status">{notice}</div>}
        <div className="table-wrap"><table><thead><tr><th>PRODUCT</th><th>PRICE</th><th>QUANTITY</th><th>STOCK STATUS</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
          {loading ? <tr><td colSpan="5" className="table-message">Loading inventory…</td></tr> : filteredProducts.length ? filteredProducts.map((product, index) => <tr key={product.id}><td><div className="product-cell"><span className={`product-glyph glyph-${index % 4}`}><Package size={18} /></span><div><strong>{product.product_name}</strong><span>{product.description || 'No description'}</span></div></div></td><td className="price-cell">{money.format(Number(product.price))}</td><td>{Number(product.quantity).toLocaleString()} <span className="units-label">units</span></td><td><span className={`stock-pill ${Number(product.quantity) < 5 ? 'stock-low' : 'stock-ready'}`}><i />{Number(product.quantity) < 5 ? 'Low stock' : 'In stock'}</span></td><td><div className="row-actions"><button className="icon-button" title={`Edit ${product.product_name}`} aria-label={`Edit ${product.product_name}`} onClick={() => setDialogProduct(product)}><Pencil size={16} /></button><button className="icon-button danger-icon" title={`Delete ${product.product_name}`} aria-label={`Delete ${product.product_name}`} onClick={() => removeProduct(product)}><Trash2 size={16} /></button></div></td></tr>) : <tr><td colSpan="5" className="table-message"><div className="empty-state"><span className="empty-icon"><Package size={24} /></span><strong>{query ? 'No matching products' : 'Your inventory is empty'}</strong><span>{query ? 'Try a different product name.' : 'Add your first product to start tracking stock.'}</span>{!query && <button className="button button-dark" onClick={() => setDialogProduct(null)}><CirclePlus size={16} /> Add first product</button>}</div></td></tr>}
        </tbody></table></div>
        <footer className="table-footer"><span>Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products</span><span>LAST SYNC <strong>{new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(new Date())}</strong></span></footer>
      </section>
      <footer className="page-footer">STOCKROOM <span>PRODUCT MANAGEMENT SYSTEM</span></footer>
    </main>
    {dialogProduct !== undefined && <ProductDialog product={dialogProduct} onClose={() => setDialogProduct(undefined)} onSave={saveProduct} />}
  </div>;
}

export default App;