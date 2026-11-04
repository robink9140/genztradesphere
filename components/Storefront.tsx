'use client';

import { useEffect, useMemo, useState } from 'react';
import Script from 'next/script';
import {
  ArrowRight, Search, ShoppingBag, Menu, X, Plus, Minus, Trash2,
  PackageCheck, ShieldCheck, Truck, Instagram, Mail, Phone
} from 'lucide-react';
import { demoProducts, Product } from '@/lib/products';
import { supabase } from '@/lib/supabase';

type CartLine = {
  product: Product;
  quantity: number;
  size: string;
  color: string;
};

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [checkout, setCheckout] = useState(false);
  const [customer, setCustomer] = useState({
    name: '', email: '', phone: '', company: '', address: ''
  });
  const [loading, setLoading] = useState(false);
  const [cartLoaded, setCartLoaded] = useState(false);

  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem('gts-cart') || '[]'));
    } catch {
      setCart([]);
    }
    setCartLoaded(true);

    if (supabase) {
      supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data?.length) setProducts(data as Product[]);
        });
    }
  }, []);

  useEffect(() => {
    if (cartLoaded) localStorage.setItem('gts-cart', JSON.stringify(cart));
  }, [cart, cartLoaded]);

  const categories = ['All', 'Men', 'Women', 'Unisex', 'Accessories'];

  const filtered = useMemo(
    () =>
      products.filter(
        p =>
          (category === 'All' || p.category === category) &&
          `${p.name} ${p.description} ${p.category}`
            .toLowerCase()
            .includes(query.toLowerCase())
      ),
    [products, category, query]
  );

  const count = cart.reduce((sum, line) => sum + line.quantity, 0);
  const total = cart.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0
  );

  function add(p: Product) {
    setCart(prev => {
      const found = prev.find(x => x.product.id === p.id);

      if (found) {
        return prev.map(x =>
          x.product.id === p.id ? { ...x, quantity: x.quantity + 1 } : x
        );
      }

      return [
        ...prev,
        {
          product: p,
          quantity: 1,
          size: p.sizes?.[0] || 'One size',
          color: p.colors?.[0] || 'Standard'
        }
      ];
    });

    setCartOpen(true);
    setNotice('Added to your cart');
  }

  function changeQty(id: string, delta: number) {
    setCart(prev =>
      prev.map(x =>
        x.product.id === id
          ? { ...x, quantity: Math.max(1, x.quantity + delta) }
          : x
      )
    );
  }

  async function pay() {
    if (!customer.name || !customer.email || !customer.phone || !customer.address) {
      setNotice('Please complete all required checkout details.');
      return;
    }

    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
      setNotice('Online payment is not configured yet. Please contact the store.');
      return;
    }

    if (cart.length === 0) {
      setNotice('Your cart is empty.');
      return;
    }

    setLoading(true);

    try {
      const items = cart.map(x => ({
        product_id: x.product.id,
        name: x.product.name,
        quantity: x.quantity,
        unit_price: x.product.price,
        size: x.size,
        color: x.color
      }));

      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total, items, customer })
      });

      const order = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(order.error || 'Could not create payment order');
      }

      const RazorpayCtor = (window as any).Razorpay;
      if (!RazorpayCtor) {
        throw new Error('Payment checkout failed to load. Refresh and try again.');
      }

      const razorpay = new RazorpayCtor({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'GenZTradeSphere',
        description: 'Retail fashion order',
        order_id: order.id,
        prefill: {
          name: customer.name,
          email: customer.email,
          contact: customer.phone
        },
        theme: { color: '#171717' },
        handler: async (response: any) => {
          try {
            const verify = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...response,
                customer,
                items,
                amount: total
              })
            });

            const result = await verify.json();
            if (!verify.ok) {
              throw new Error(result.error || 'Payment verification failed');
            }

            setCart([]);
            setCheckout(false);
            setCartOpen(false);
            setNotice(`Payment verified! Your order reference is ${result.orderReference}`);
          } catch (error) {
            setNotice(
              error instanceof Error ? error.message : 'Payment verification failed'
            );
          }
        }
      });

      razorpay.open();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#fafaf8]/95 backdrop-blur border-b border-[#e8e8e1]">
        <div className="container h-[74px] flex items-center justify-between gap-6">
          <a href="#home" className="flex items-center gap-2">
            <span className="w-9 h-9 bg-[#d4ff3f] rounded-full grid place-items-center font-black text-sm">G</span>
            <span className="font-black tracking-[-.06em] text-[20px]">
              GenZ<span className="font-normal">TradeSphere</span>
              <span className="block text-[8px] tracking-[.22em] font-bold text-[#777] -mt-1">
                STYLE FOR EVERYONE
              </span>
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-wider">
            <a href="#shop" className="hover:opacity-60">Shop</a>
            <a href="#collections" className="hover:opacity-60">Collections</a>
            <a href="#how" className="hover:opacity-60">How it works</a>
            <a href="#contact" className="hover:opacity-60">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <a href="/login" className="hidden sm:block text-[11px] font-bold uppercase tracking-wider">
              My account
            </a>
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Open shopping cart"
              className="relative w-10 h-10 rounded-full border border-[#ddd] grid place-items-center"
            >
              <ShoppingBag size={17} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#d4ff3f] rounded-full min-w-5 h-5 px-1 text-[10px] grid place-items-center font-bold">
                  {count}
                </span>
              )}
            </button>
            <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t p-5 grid gap-4 text-xs font-bold uppercase">
            <a href="#shop" onClick={() => setMobileOpen(false)}>Shop</a>
            <a href="#collections" onClick={() => setMobileOpen(false)}>Collections</a>
            <a href="#how" onClick={() => setMobileOpen(false)}>How it works</a>
            <a href="/login">My account</a>
          </div>
        )}
      </header>

      <main id="home">
        <section className="bg-[#e9e9e2] overflow-hidden">
          <div className="container grid md:grid-cols-[1fr_.9fr] items-center min-h-[570px] py-14 gap-8">
            <div className="relative z-10">
              <div className="eyebrow flex items-center gap-2 mb-7">
                <span className="w-7 h-px bg-black" />
                EVERYDAY FASHION • MADE FOR YOU
              </div>
              <h1 className="display max-w-[650px]">
                Wear your style.<br />
                <span className="text-[#7c7c72]">Own</span> your look.
              </h1>
              <p className="text-[#66665e] max-w-[430px] leading-7 mt-7 text-[15px]">
                Discover fresh styles for every day. Shop your favourite clothing and accessories, one item at a time.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <a href="#shop" className="btn">Shop the collection <ArrowRight size={15} /></a>
                <a href="#how" className="btn btn-outline">Discover more</a>
              </div>
              <div className="flex gap-8 mt-12 pt-6 border-t border-[#d2d2c9] max-w-[420px]">
                <div>
                  <div className="text-2xl font-black tracking-tight">1+</div>
                  <div className="text-[9px] tracking-widest text-[#777] mt-1">NO MINIMUM ORDER</div>
                </div>
                <div>
                  <div className="text-2xl font-black tracking-tight">Fresh</div>
                  <div className="text-[9px] tracking-widest text-[#777] mt-1">NEW STYLES</div>
                </div>
                <div>
                  <div className="text-2xl font-black tracking-tight">India</div>
                  <div className="text-[9px] tracking-widest text-[#777] mt-1">PAN-INDIA DELIVERY*</div>
                </div>
              </div>
            </div>

            <div className="relative h-[430px] md:h-[500px]">
              <div className="absolute inset-4 bg-[#d4ff3f] rounded-t-[48%] rounded-b-[8px] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=90"
                  alt="Contemporary fashion collection"
                  className="w-full h-full object-cover mix-blend-multiply opacity-90"
                />
              </div>
              <div className="absolute bottom-8 -left-2 bg-white p-4 shadow-xl max-w-[190px]">
                <div className="eyebrow text-[#777]">THE EVERYDAY EDIT</div>
                <div className="font-black text-xl tracking-tight mt-2">Fresh drops.<br />Your style.</div>
              </div>
              <div className="absolute top-8 right-0 bg-[#171717] text-white rounded-full w-20 h-20 grid place-items-center text-center text-[9px] font-bold tracking-widest rotate-12">
                MADE FOR<br />YOU
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#171717] text-white py-4">
          <div className="container flex flex-wrap justify-between gap-4 text-[10px] uppercase tracking-[.16em] font-bold">
            <span className="flex items-center gap-2"><PackageCheck size={15} /> Shop individual pieces</span>
            <span className="flex items-center gap-2"><ShieldCheck size={15} /> Secure checkout</span>
            <span className="flex items-center gap-2"><Truck size={15} /> Pan-India delivery*</span>
            <span className="text-[#aaa]">*Subject to serviceability</span>
          </div>
        </section>

        <section id="collections" className="section-pad">
          <div className="container">
            <div className="flex justify-between items-end gap-4 mb-8">
              <div>
                <div className="eyebrow text-[#777] mb-3">FIND YOUR STYLE</div>
                <h2 className="text-4xl font-black tracking-[-.06em]">
                  Shop by collection<span className="text-[#a1a18f]">.</span>
                </h2>
              </div>
              <a href="#shop" className="hidden sm:flex text-xs font-bold uppercase tracking-wider items-center gap-2">
                View all <ArrowRight size={14} />
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { n: 'Menswear', c: 'Men', i: 'photo-1515886657613-9f3515b0c78f' },
                { n: 'Womenswear', c: 'Women', i: 'photo-1483985988355-763728e1935b' },
                { n: 'Unisex essentials', c: 'Unisex', i: 'photo-1523398002811-999ca8dec234' },
                { n: 'Accessories', c: 'Accessories', i: 'photo-1544816155-12df9643f363' }
              ].map(x => (
                <button
                  key={x.c}
                  onClick={() => {
                    setCategory(x.c);
                    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="relative aspect-[4/5] overflow-hidden bg-[#eee] text-left group"
                >
                  <img
                    src={`https://images.unsplash.com/${x.i}?w=700&q=80`}
                    alt={x.n}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                  <div className="absolute bottom-5 left-5 text-white">
                    <div className="font-black text-xl">{x.n}</div>
                    <div className="text-[10px] uppercase tracking-widest mt-1">Explore collection ↗</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="shop" className="section-pad bg-[#f0f0eb]">
          <div className="container">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
              <div>
                <div className="eyebrow text-[#777] mb-3">THE LATEST LINEUP</div>
                <h2 className="text-4xl font-black tracking-[-.06em]">
                  Shop all products<span className="text-[#a1a18f]">.</span>
                </h2>
                <p className="text-sm text-[#777] mt-2">
                  Shop your favourite styles, one item at a time. Prices shown per item.
                </p>
              </div>
              <div className="relative w-full md:w-[270px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" />
                <input
                  className="field pl-10"
                  placeholder="Search products..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-7">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-4 py-2 rounded-full text-[10px] uppercase tracking-wider font-bold border ${
                    category === c
                      ? 'bg-[#171717] text-white border-[#171717]'
                      : 'bg-white border-[#ddd]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(p => (
                <article className="product-card" key={p.id}>
                  <div className="product-image">
                    <img src={p.image} alt={p.name} />
                    {p.badge && (
                      <span className="absolute top-3 left-3 bg-[#d4ff3f] px-2 py-1 text-[9px] font-black tracking-wider">
                        {p.badge}
                      </span>
                    )}
                    <span className="absolute bottom-3 right-3 bg-white/95 px-2 py-1 text-[9px] font-bold">
                      In stock: {p.stock}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="text-[9px] uppercase tracking-widest text-[#888] font-bold">{p.category}</div>
                    <h3 className="font-bold text-[14px] mt-2 leading-snug min-h-[38px]">{p.name}</h3>
                    <div className="flex items-baseline gap-2 mt-3">
                      <span className="text-xl font-black">₹{p.price.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-[#999] line-through">₹{p.mrp.toLocaleString('en-IN')}</span>
                      <span className="text-[9px] text-[#777]">/ item</span>
                    </div>
                    <div className="text-[10px] text-[#777] mt-2">
                      {p.stock} units available · {p.sizes.slice(0, 4).join(', ')}
                    </div>
                    <button onClick={() => add(p)} className="w-full mt-4 btn btn-dark">
                      Add to cart <Plus size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16 text-[#777]">
                No products found. Try another search or category.
              </div>
            )}

            <p className="text-[10px] text-[#888] mt-5">
              Product prices and stock should be verified before accepting live orders.
            </p>
          </div>
        </section>

        <section id="how" className="section-pad">
          <div className="container">
            <div className="text-center max-w-xl mx-auto mb-12">
              <div className="eyebrow text-[#777] mb-3">SIMPLE SHOPPING</div>
              <h2 className="text-4xl font-black tracking-[-.06em]">Shopping made simple.</h2>
              <p className="text-sm text-[#777] mt-4 leading-6">
                Find your favourites, add them to your cart and checkout securely.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { n: '01', t: 'Discover', d: 'Browse our clothing and accessories collections to find your style.' },
                { n: '02', t: 'Add to cart', d: 'Choose your favourite products. You can buy just one item or more.' },
                { n: '03', t: 'Checkout securely', d: 'Enter your delivery details and complete payment when online payments are enabled.' }
              ].map(x => (
                <div key={x.n} className="border-t-2 border-[#d4ff3f] pt-5">
                  <div className="text-sm font-black text-[#999]">{x.n}</div>
                  <h3 className="text-2xl font-black mt-5 tracking-tight">{x.t}</h3>
                  <p className="text-sm text-[#777] mt-3 leading-6">{x.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#d4ff3f] py-16">
          <div className="container flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <div className="eyebrow mb-3">READY FOR A FRESH LOOK?</div>
              <h2 className="text-4xl md:text-5xl font-black tracking-[-.06em]">
                Find your style.<br />Make it yours.
              </h2>
            </div>
            <a href="#shop" className="btn btn-dark">Shop now <ArrowRight size={15} /></a>
          </div>
        </section>
      </main>

      <footer id="contact" className="bg-[#171717] text-white py-14">
        <div className="container">
          <div className="grid md:grid-cols-[1.5fr_1fr_1fr] gap-10">
            <div>
              <div className="font-black text-2xl tracking-[-.06em]">GenZTradeSphere</div>
              <p className="text-[#aaa] text-sm leading-6 mt-4 max-w-sm">
                A modern fashion destination for clothing and accessories, with convenient shopping and delivery across India.
              </p>
              <div className="flex gap-3 mt-5">
                <a aria-label="Instagram" href="#" className="w-9 h-9 rounded-full border border-[#555] grid place-items-center">
                  <Instagram size={15} />
                </a>
                <a aria-label="Email" href="mailto:supportgenztradesphere@gmail.com" className="w-9 h-9 rounded-full border border-[#555] grid place-items-center">
                  <Mail size={15} />
                </a>
              </div>
            </div>

            <div>
              <div className="eyebrow text-[#999] mb-5">EXPLORE</div>
              <div className="grid gap-3 text-sm text-[#ddd]">
                <a href="#shop">Shop</a>
                <a href="#collections">Collections</a>
                <a href="#how">How it works</a>
                <a href="/login">My account</a>
                <a href="/about">About us</a>
                <a href="/contact">Contact us</a>
                <a href="/terms">Terms &amp; conditions</a>
                <a href="/privacy-policy">Privacy policy</a>
                <a href="/shipping-policy">Shipping policy</a>
                <a href="/refund-policy">Returns &amp; refunds</a>
              </div>
            </div>

            <div>
              <div className="eyebrow text-[#999] mb-5">GET IN TOUCH</div>
              <div className="grid gap-3 text-sm text-[#ddd]">
                <a href="mailto:supportgenztradesphere@gmail.com" className="flex gap-2 items-center">
                  <Mail size={14} /> supportgenztradesphere@gmail.com
                </a>
                <a href="tel:+919140244915" className="flex gap-2 items-center">
                  <Phone size={14} /> +91 9140244915
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-[#444] mt-12 pt-6 flex flex-col sm:flex-row justify-between gap-3 text-[10px] text-[#888]">
            <span>© {new Date().getFullYear()} GenZTradeSphere. All rights reserved.</span>
            <span>
              <a href="/privacy-policy">Privacy</a> · <a href="/terms">Terms</a> ·
              <a href="/shipping-policy">Shipping</a> · <a href="/refund-policy">Returns &amp; refunds</a>
            </span>
          </div>
        </div>
      </footer>

      {cartOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex justify-end"
          onClick={() => setCartOpen(false)}
        >
          <aside
            className="bg-[#fafaf8] w-full max-w-[480px] h-full overflow-y-auto p-5 sm:p-7"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b pb-5">
              <div>
                <div className="eyebrow text-[#777]">YOUR SHOPPING BAG</div>
                <h2 className="text-2xl font-black mt-1">Shopping cart ({count})</h2>
              </div>
              <button onClick={() => setCartOpen(false)} aria-label="Close cart"><X /></button>
            </div>

            {!checkout ? (
              <>
                <div className="py-5 grid gap-5">
                  {cart.map(line => (
                    <div key={line.product.id} className="flex gap-4">
                      <img src={line.product.image} alt="" className="w-20 h-24 object-cover bg-[#eee]" />
                      <div className="flex-1">
                        <div className="font-bold text-sm">{line.product.name}</div>
                        <div className="text-xs text-[#777] mt-1">₹{line.product.price.toLocaleString('en-IN')} / item</div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-3">
                            <button onClick={() => changeQty(line.product.id, -1)} className="border rounded-full p-1" aria-label="Decrease quantity">
                              <Minus size={12} />
                            </button>
                            <span className="text-sm font-bold">{line.quantity}</span>
                            <button onClick={() => changeQty(line.product.id, 1)} className="border rounded-full p-1" aria-label="Increase quantity">
                              <Plus size={12} />
                            </button>
                          </div>
                          <button onClick={() => setCart(prev => prev.filter(x => x.product.id !== line.product.id))} aria-label="Remove item">
                            <Trash2 size={15} className="text-[#888]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {cart.length === 0 && (
                    <p className="text-sm text-[#777] py-10 text-center">
                      Your cart is waiting for its first item.
                    </p>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="border-t pt-5">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <b>₹{total.toLocaleString('en-IN')}</b>
                    </div>
                    <p className="text-[10px] text-[#888] mt-2">
                      Shipping and applicable taxes are calculated separately.
                    </p>
                    <button className="btn btn-dark w-full mt-5" onClick={() => setCheckout(true)}>
                      Continue to checkout <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <button className="text-xs font-bold my-5" onClick={() => setCheckout(false)}>
                  ← Back to cart
                </button>
                <h3 className="text-2xl font-black mb-2">Delivery details</h3>
                <p className="text-xs text-[#777] mb-5">
                  Enter your contact and delivery details for this order.
                </p>

                <div className="grid gap-3">
                  <input
                    className="field"
                    placeholder="Full name *"
                    value={customer.name}
                    onChange={e => setCustomer({ ...customer, name: e.target.value })}
                  />
                  <input
                    className="field"
                    placeholder="Email address *"
                    type="email"
                    value={customer.email}
                    onChange={e => setCustomer({ ...customer, email: e.target.value })}
                  />
                  <input
                    className="field"
                    placeholder="Mobile number *"
                    value={customer.phone}
                    onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                  />
                  <textarea
                    className="field min-h-24"
                    placeholder="Full delivery address *"
                    value={customer.address}
                    onChange={e => setCustomer({ ...customer, address: e.target.value })}
                  />
                </div>

                <div className="flex justify-between border-t mt-6 pt-5">
                  <span className="font-bold">Order total</span>
                  <b className="text-xl">₹{total.toLocaleString('en-IN')}</b>
                </div>

                <button
                  disabled={loading}
                  onClick={pay}
                  className="btn btn-dark w-full mt-5 disabled:opacity-50"
                >
                  {loading ? 'Preparing secure payment…' : 'Pay securely with Razorpay'}
                </button>
                <div className="flex justify-center gap-2 items-center text-[10px] text-[#888] mt-4">
                  <ShieldCheck size={13} /> Payment secured by Razorpay
                </div>
              </>
            )}

            {notice && (
              <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-[#171717] text-white px-5 py-3 rounded-full text-xs shadow-xl max-w-[90vw]">
                {notice}
                <button className="ml-3 text-[#d4ff3f]" onClick={() => setNotice('')}>×</button>
              </div>
            )}
          </aside>
        </div>
      )}

      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
    </>
  );
}
