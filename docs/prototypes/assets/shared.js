// Shared header + footer for Frésia
(function() {
  const path = window.location.pathname.split('/').pop();

  const Header = ({ cartCount = 3, activePage = 'home' }) => {
    const navItems = [
      { key: 'home',    label: 'Home',     href: 'Home.html' },
      { key: 'shop',    label: 'Loja',     href: 'Store.html' },
      { key: 'bouquets',label: 'Buquês',   href: 'Store.html' },
      { key: 'events',  label: 'Eventos',  href: '#' },
      { key: 'about',   label: 'Sobre',    href: '#' },
    ];
    return (
      <header className="fresia-header">
        <div className="fresia-header-inner">
          <a href="Home.html" className="fresia-logo">
            <img src="assets/logo-fresia.png" alt="Frésia" />
          </a>
          <nav className="fresia-nav">
            {navItems.map(i => (
              <a key={i.key} href={i.href} className={activePage === i.key ? 'active' : ''}>{i.label}</a>
            ))}
          </nav>
          <div className="fresia-header-actions">
            <button className="fresia-search-btn" title="Buscar">
              <svg className="icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            </button>
            <a href="Account.html" className="fresia-icon-btn" title="Conta">
              <svg className="icon" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>
            </a>
            <a href="#" className="fresia-icon-btn" title="Favoritos">
              <svg className="icon" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </a>
            <a href="Cart.html" className="fresia-cart-btn" title="Carrinho">
              <svg className="icon" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              {cartCount > 0 && <span className="fresia-cart-badge">{cartCount}</span>}
            </a>
          </div>
        </div>
      </header>
    );
  };

  const Footer = () => (
    <footer className="fresia-footer">
      <div className="container">
        <div className="fresia-footer-grid">
          <div>
            <div className="fresia-footer-brand">Frésia</div>
            <p className="fresia-footer-tag">Floricultura boutique — arranjos<br/> autorais feitos à mão em São Paulo.</p>
            <div className="fresia-socials">
              <a href="#"><svg className="icon-sm icon" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg></a>
              <a href="#"><svg className="icon-sm icon" viewBox="0 0 24 24"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg></a>
              <a href="#"><svg className="icon-sm icon" viewBox="0 0 24 24"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg></a>
            </div>
          </div>
          <div>
            <h5>Loja</h5>
            <a href="Store.html">Todas as flores</a>
            <a href="#">Buquês</a>
            <a href="#">Arranjos</a>
            <a href="#">Plantas</a>
            <a href="#">Eventos</a>
          </div>
          <div>
            <h5>Ajuda</h5>
            <a href="Tracking.html">Rastrear pedido</a>
            <a href="#">Entrega & frete</a>
            <a href="#">Trocas</a>
            <a href="#">FAQ</a>
          </div>
          <div>
            <h5>Receba novidades</h5>
            <p className="fresia-footer-tag">Ofertas, novas coleções e inspirações direto no seu e-mail.</p>
            <form className="fresia-newsletter" onSubmit={(e) => e.preventDefault()}>
              <input className="input" placeholder="seu@email.com" />
              <button className="btn btn-primary" type="submit">Assinar</button>
            </form>
          </div>
        </div>
        <div className="fresia-footer-bottom">
          <span>© 2026 Frésia Flores. Feito com cuidado em SP.</span>
          <span>CNPJ 00.000.000/0001-00</span>
        </div>
      </div>
    </footer>
  );

  window.FresiaHeader = Header;
  window.FresiaFooter = Footer;
})();
