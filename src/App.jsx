import React, { useState, useEffect, useCallback } from "react";
import {
  Home, Search, ShoppingBag, Heart, User, ChevronRight, ChevronLeft, Plus, Minus,
  MapPin, Phone, Clock, Star, Check, X, Bell, Package, Truck, Store as StoreIcon,
  LayoutDashboard, Settings, LogOut, Trash2, Pencil, AlertCircle, ShoppingCart,
  UtensilsCrossed, ShoppingBasket, Croissant, Cake, CupSoda, Pill, Wrench,
  MessageCircle, RefreshCw, ClipboardList, Users, Bike, CircleDollarSign, Eye, EyeOff
} from "lucide-react";
import { api } from "./api";

/* ============================== ألوان الهوية البصرية ============================== */
const C = {
  primary: "#4B6B33",
  primaryDark: "#37501F",
  primaryLight: "#EDF2E4",
  accent: "#E3A23D",
  accentDark: "#C3821F",
  bg: "#FBF8F1",
  surface: "#FFFFFF",
  text: "#26291F",
  textMuted: "#767C69",
  border: "#E8E3D4",
  success: "#3F8556",
  successBg: "#E7F3EA",
  warning: "#C3821F",
  warningBg: "#FBF0DD",
  danger: "#BD4B3C",
  dangerBg: "#FBEAE7",
};

/* ============================== بيانات ثابتة ============================== */
const CATEGORIES = [
  { id: "restaurants", name: "مطاعم", Icon: UtensilsCrossed },
  { id: "grocery", name: "بقالة", Icon: ShoppingBasket },
  { id: "bakery", name: "مخابز", Icon: Croissant },
  { id: "sweets", name: "حلويات", Icon: Cake },
  { id: "drinks", name: "مشروبات", Icon: CupSoda },
  { id: "pharmacy", name: "صيدليات", Icon: Pill },
  { id: "shops", name: "متاجر", Icon: StoreIcon },
  { id: "services", name: "خدمات", Icon: Wrench },
];
const CAT_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.name]));

const AREAS = ["حي الوسط", "حي الشرق", "حي الغرب", "حي الشمال", "حي الجنوب", "خارج عقربا"];
const PHONE_HINT_REGEX = /^(?:\+970|\+972|970|972|0)5\d{8}$/;

const INTERNAL_ORDER = ["PENDING", "CONFIRMED", "PREPARING", "READY", "ASSIGNED", "PICKED_UP", "ON_THE_WAY", "DELIVERED"];
const STATUS_LABELS = {
  PENDING: "تم استلام الطلب",
  CONFIRMED: "المحل أكد الطلب",
  PREPARING: "الطلب قيد التحضير",
  READY: "الطلب جاهز",
  ASSIGNED: "تم تعيين مندوب للطلب",
  PICKED_UP: "المندوب استلم الطلب من المحل",
  ON_THE_WAY: "المندوب في الطريق إليك",
  DELIVERED: "تم تسليم الطلب",
  CANCELLED: "تم إلغاء الطلب",
};
const CUSTOMER_STEPS = [
  { key: "PENDING", label: "تم استلام الطلب" },
  { key: "CONFIRMED", label: "المحل يؤكد الطلب" },
  { key: "PREPARING", label: "قيد التحضير" },
  { key: "READY", label: "الطلب جاهز" },
  { key: "ON_THE_WAY", label: "المندوب في الطريق" },
  { key: "DELIVERED", label: "تم التسليم" },
];
function customerStepIndex(status) {
  if (status === "CANCELLED") return -1;
  if (["ASSIGNED", "PICKED_UP", "ON_THE_WAY"].includes(status)) return 4;
  const i = CUSTOMER_STEPS.findIndex((s) => s.key === status);
  return i === -1 ? (INTERNAL_ORDER.indexOf(status) >= INTERNAL_ORDER.indexOf("DELIVERED") ? 5 : 0) : i;
}

// ملاحظة: بيانات الحسابات التجريبية، المحلات، المنتجات، والتخزين
// كلها الآن على الخادم الحقيقي (talabak-backend) وليست هنا بعد الآن.

/* ============================== عناصر واجهة عامة ============================== */
function Btn({ children, onClick, variant = "primary", full, disabled, size = "md", icon: Icon, type = "button" }) {
  const base = { border: "none", cursor: disabled ? "not-allowed" : "pointer", borderRadius: 14, fontFamily: "inherit", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "transform .1s ease, opacity .15s ease", opacity: disabled ? 0.5 : 1 };
  const sizes = { md: { padding: "13px 18px", fontSize: 15 }, sm: { padding: "8px 14px", fontSize: 13.5 }, lg: { padding: "16px 20px", fontSize: 16.5 } };
  const variants = {
    primary: { background: C.primary, color: "#fff" },
    accent: { background: C.accent, color: "#fff" },
    secondary: { background: C.primaryLight, color: C.primaryDark },
    ghost: { background: "transparent", color: C.text, border: `1.5px solid ${C.border}` },
    danger: { background: C.dangerBg, color: C.danger },
    dark: { background: C.text, color: "#fff" },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      style={{ ...base, ...sizes[size], ...variants[variant], width: full ? "100%" : undefined }}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
      {Icon && <Icon size={size === "lg" ? 20 : 17} />}
      {children}
    </button>
  );
}

function Badge({ children, tone = "default" }) {
  const tones = {
    default: { bg: C.primaryLight, fg: C.primaryDark },
    success: { bg: C.successBg, fg: C.success },
    warning: { bg: C.warningBg, fg: C.warning },
    danger: { bg: C.dangerBg, fg: C.danger },
    muted: { bg: "#F1EFE6", fg: C.textMuted },
  };
  const t = tones[tone];
  return <span style={{ background: t.bg, color: t.fg, fontSize: 12.5, fontWeight: 700, padding: "4px 10px", borderRadius: 999 }}>{children}</span>;
}

function TopHeader({ title, onBack, right }) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 20, background: C.bg, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 12px", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {onBack && (
          <button onClick={onBack} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronRight size={19} color={C.text} />
          </button>
        )}
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{title}</div>
      </div>
      {right}
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub, action }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center", gap: 10 }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
        <Icon size={28} color={C.primary} />
      </div>
      <div style={{ fontWeight: 800, fontSize: 16, color: C.text }}>{title}</div>
      {sub && <div style={{ fontSize: 13.5, color: C.textMuted, maxWidth: 260 }}>{sub}</div>}
      {action}
    </div>
  );
}

function Skeleton({ h = 90, r = 16 }) {
  return <div style={{ height: h, borderRadius: r, background: "linear-gradient(90deg,#EFEBDD 25%,#F6F3E8 37%,#EFEBDD 63%)", backgroundSize: "400% 100%", animation: "shimmer 1.4s ease infinite" }} />;
}

function Timeline({ status }) {
  const idx = customerStepIndex(status);
  if (status === "CANCELLED") {
    return (
      <div style={{ background: C.dangerBg, borderRadius: 16, padding: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <X size={20} color={C.danger} />
        <div style={{ color: C.danger, fontWeight: 700 }}>تم إلغاء هذا الطلب</div>
      </div>
    );
  }
  return (
    <div>
      {CUSTOMER_STEPS.map((s, i) => {
        const done = i <= idx;
        const isLast = i === CUSTOMER_STEPS.length - 1;
        return (
          <div key={s.key} style={{ display: "flex", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: done ? C.success : "#EDEAE0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {done && <Check size={15} color="#fff" />}
              </div>
              {!isLast && <div style={{ width: 2, flex: 1, minHeight: 28, background: i < idx ? C.success : "#EDEAE0" }} />}
            </div>
            <div style={{ paddingBottom: 26 }}>
              <div style={{ fontWeight: done ? 800 : 600, color: done ? C.text : C.textMuted, fontSize: 14.5 }}>{s.label}</div>
              {i === idx && <div style={{ fontSize: 12.5, color: C.success, marginTop: 2 }}>الحالة الحالية</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function money(n) {
  return `${n.toFixed(0)} ₪`;
}

/* ============================== شاشة الدخول / التسجيل ============================== */
function LoginScreen({ onLogin }) {
  const [stage, setStage] = useState("splash");
  const [obIndex, setObIndex] = useState(0);
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStage("onboarding"), 1400);
    return () => clearTimeout(t);
  }, []);

  if (stage === "splash") {
    return (
      <div style={{ height: "100%", background: C.primary, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", gap: 10 }}>
        <div style={{ width: 84, height: 84, borderRadius: 24, background: "rgba(255,255,255,.16)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🛵</div>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 0.5 }}>طلبك</div>
        <div style={{ fontSize: 14.5, opacity: 0.85 }}>طلبك... لباب بيتك</div>
      </div>
    );
  }

  if (stage === "onboarding") {
    const slides = [
      { emoji: "🧾", title: "كل طلباتك في مكان واحد", sub: "تصفح محلات عقربا واطلب بضغطة واحدة" },
      { emoji: "🏠", title: "من محلات عقربا إلى باب بيتك", sub: "توصيل سريع لكل أحياء القرية" },
      { emoji: "💵", title: "اطلب الآن وادفع عند الاستلام", sub: "بدون بطاقات، بدون تعقيد" },
    ];
    const s = slides[obIndex];
    return (
      <div style={{ height: "100%", background: C.bg, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", gap: 14 }}>
          <div style={{ fontSize: 64 }}>{s.emoji}</div>
          <div style={{ fontSize: 21, fontWeight: 800, color: C.text }}>{s.title}</div>
          <div style={{ fontSize: 14.5, color: C.textMuted, maxWidth: 260 }}>{s.sub}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
          {slides.map((_, i) => <div key={i} style={{ width: i === obIndex ? 22 : 7, height: 7, borderRadius: 4, background: i === obIndex ? C.primary : C.border, transition: "all .2s" }} />)}
        </div>
        <div style={{ padding: 20 }}>
          <Btn full size="lg" onClick={() => (obIndex < 2 ? setObIndex(obIndex + 1) : setStage("auth"))}>
            {obIndex < 2 ? "التالي" : "ابدأ الآن"}
          </Btn>
        </div>
      </div>
    );
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (busy) return;
    if (mode === "register") {
      if (!regName || !regPhone || !email.trim() || !password.trim()) { setError("الرجاء تعبئة جميع الحقول"); return; }
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError("صيغة البريد الإلكتروني غير صحيحة"); return; }
      if (!PHONE_HINT_REGEX.test(regPhone.trim())) { setError("رقم الهاتف غير صحيح — استخدم صيغة فلسطينية أو إسرائيلية مثل 0599123456"); return; }
      if (password.trim().length < 6) { setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
      setBusy(true);
      try {
        const { token, user } = await api.register({ name: regName, phone: regPhone.trim(), email: email.trim(), password: password.trim() });
        onLogin({ token, user });
      } catch (err) {
        setError(err.message);
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!email.trim() || !password.trim()) { setError("الرجاء إدخال البريد الإلكتروني وكلمة المرور"); return; }
    setBusy(true);
    try {
      const { token, user } = await api.login(email.trim(), password.trim());
      onLogin({ token, user });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", background: C.bg, padding: "28px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🛵</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 19, color: C.text }}>طلبك</div>
          <div style={{ fontSize: 12.5, color: C.textMuted }}>طلبك... لباب بيتك</div>
        </div>
      </div>

      <div style={{ display: "flex", background: C.surface, borderRadius: 14, padding: 4, marginBottom: 18, border: `1px solid ${C.border}` }}>
        <button onClick={() => setMode("login")} style={{ flex: 1, padding: "10px 0", borderRadius: 11, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, background: mode === "login" ? C.primary : "transparent", color: mode === "login" ? "#fff" : C.textMuted }}>تسجيل الدخول</button>
        <button onClick={() => setMode("register")} style={{ flex: 1, padding: "10px 0", borderRadius: 11, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, background: mode === "register" ? C.primary : "transparent", color: mode === "register" ? "#fff" : C.textMuted }}>حساب جديد</button>
      </div>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {mode === "register" && (
          <>
            <Field label="الاسم الكامل"><input value={regName} onChange={(e) => setRegName(e.target.value)} style={inputStyle} placeholder="مثال: أحمد يوسف" /></Field>
            <Field label="رقم الهاتف"><input value={regPhone} onChange={(e) => setRegPhone(e.target.value)} style={inputStyle} placeholder="0599123456" dir="ltr" /></Field>
          </>
        )}
        {mode === "login" && (
          <Field label="البريد الإلكتروني"><input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="example@talabak.local" dir="ltr" autoCapitalize="none" autoCorrect="off" spellCheck="false" /></Field>
        )}
        <Field label="كلمة المرور">
          <div style={{ position: "relative" }}>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPw ? "text" : "password"} style={{ ...inputStyle, paddingLeft: 40 }} placeholder="••••••••" dir="ltr" autoCapitalize="none" autoCorrect="off" spellCheck="false" />
            <button type="button" onClick={() => setShowPw((v) => !v)} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.textMuted }}>
              {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </Field>
        {error && <div style={{ color: C.danger, fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}><AlertCircle size={15} />{error}</div>}
        <Btn full size="lg" type="submit" disabled={busy}>{busy ? "جارِ التحقق..." : mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}</Btn>
      </form>
      {mode === "login" && <div style={{ marginTop: 14, fontSize: 12, color: C.textMuted, textAlign: "center" }}>استخدم بيانات الدخول التجريبية من ملف DEMO_CREDENTIALS، أو أنشئ حسابًا جديدًا</div>}
    </div>
  );
}
function Field({ label, children }) {
  return <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{label}</span>{children}</label>;
}
const inputStyle = { width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.surface, fontSize: 14.5, fontFamily: "inherit", color: C.text, outline: "none" };

/* ============================== تطبيق العميل ============================== */
function CustomerApp({ user, onLogout }) {
  const [tab, setTab] = useState("home");
  const [screen, setScreen] = useState({ name: "home" });
  const [cart, setCart] = useState([]); // {productId, storeId, name, price, qty, options, notes}
  const [toast, setToast] = useState(null);

  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [tracking, setTracking] = useState(null); // { order, driver }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2200); }

  const loadAll = useCallback(async () => {
    setLoadError(null);
    try {
      const { stores: storeList } = await api.stores();
      const productLists = await Promise.all(storeList.map((s) => api.products(s.id)));
      const allProducts = productLists.flatMap((r) => r.products);
      const [{ orders: myOrders }, { storeIds }] = await Promise.all([api.myOrders(), api.myFavorites()]);
      setStores(storeList);
      setProducts(allProducts);
      setOrders(myOrders);
      setFavorites(new Set(storeIds));
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // تتبع حي للطلب الحالي: نجلب تفاصيله (بما فيها المندوب) ونحدّثها كل بضع ثوانٍ
  useEffect(() => {
    if (screen.name !== "tracking" || !screen.orderId) { setTracking(null); return; }
    let cancelled = false;
    async function fetchTracking() {
      try {
        const { order, driver } = await api.order(screen.orderId);
        if (cancelled) return;
        setTracking({ order, driver });
        setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
      } catch { /* تجاهل أخطاء التحديث الدوري */ }
    }
    fetchTracking();
    const interval = setInterval(fetchTracking, 6000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [screen.name, screen.orderId]);

  const cartStoreId = cart[0]?.storeId || null;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartSubtotal = cart.reduce((s, i) => s + i.qty * (i.price + i.options.reduce((a, o) => a + o.price, 0)), 0);

  function addToCart(item) {
    if (cartStoreId && cartStoreId !== item.storeId) {
      if (!window.confirm("سلتك تحتوي منتجات من محل آخر. هل تريد إفراغ السلة والبدء من جديد؟")) return;
      setCart([item]); showToast("تمت إضافة المنتج للسلة"); return;
    }
    setCart((c) => [...c, item]);
    showToast("تمت إضافة المنتج للسلة");
  }
  function updateQty(idx, delta) {
    setCart((c) => c.map((it, i) => (i === idx ? { ...it, qty: Math.max(1, it.qty + delta) } : it)));
  }
  function removeItem(idx) { setCart((c) => c.filter((_, i) => i !== idx)); }

  function go(name, params = {}) { setScreen({ name, ...params }); }

  async function toggleFavorite(storeId) {
    try {
      const { storeIds } = await api.toggleFavorite(storeId);
      setFavorites(new Set(storeIds));
    } catch (err) { showToast(err.message); }
  }

  async function placeOrder(address, phone, notes) {
    const payload = {
      storeId: cartStoreId,
      items: cart.map(({ productId, name, price, qty, options, notes: itemNotes }) => ({ productId, name, price, quantity: qty, options, notes: itemNotes })),
      address, phone, orderNotes: notes,
    };
    try {
      const { order } = await api.createOrder(payload);
      setOrders((prev) => [order, ...prev]);
      setCart([]);
      go("success", { orderId: order.id });
    } catch (err) {
      showToast(err.message);
    }
  }

  async function submitReview(orderId, rating, comment) {
    try {
      const { review } = await api.reviewOrder(orderId, rating, comment);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, review } : o)));
    } catch (err) { showToast(err.message); }
  }

  function reorder(order) {
    const store = stores.find((s) => s.id === order.storeId);
    if (!store) { showToast("هذا المحل غير متاح حاليًا"); return; }
    const items = order.items.map((it) => ({ productId: it.productId, storeId: order.storeId, name: it.name, price: it.price, qty: it.quantity, options: it.options || [], notes: it.notes || "" }));
    setCart(items);
    go("cart");
  }

  if (loading) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 34 }}>🛵</div>
        <div style={{ color: C.textMuted, fontSize: 13 }}>جارِ تحميل محلات عقربا...</div>
      </div>
    );
  }
  if (loadError) {
    return <EmptyState icon={AlertCircle} title="تعذّر الاتصال بالخادم" sub={loadError} action={<div style={{ marginTop: 10 }}><Btn onClick={loadAll}>إعادة المحاولة</Btn></div>} />;
  }

  const db = { stores, products };

  let body;
  if (screen.name === "home") body = <HomeScreen user={user} db={db} go={go} favorites={favorites} toggleFavorite={toggleFavorite} myOrders={orders} reorder={reorder} />;
  else if (screen.name === "search") body = <SearchScreen db={db} go={go} category={screen.category} />;
  else if (screen.name === "store") body = <StorePage store={stores.find((s) => s.id === screen.storeId)} products={products.filter((p) => p.storeId === screen.storeId)} go={go} isFav={favorites.has(screen.storeId)} toggleFavorite={toggleFavorite} />;
  else if (screen.name === "product") body = <ProductScreen product={products.find((p) => p.id === screen.productId)} storeId={screen.storeId} go={go} addToCart={addToCart} />;
  else if (screen.name === "cart") body = <CartScreen cart={cart} store={stores.find((s) => s.id === cartStoreId)} updateQty={updateQty} removeItem={removeItem} subtotal={cartSubtotal} go={go} />;
  else if (screen.name === "checkout") body = <CheckoutScreen store={stores.find((s) => s.id === cartStoreId)} subtotal={cartSubtotal} user={user} go={go} placeOrder={placeOrder} />;
  else if (screen.name === "success") body = <SuccessScreen orderId={screen.orderId} go={go} />;
  else if (screen.name === "tracking") body = <TrackingScreen order={tracking?.order || orders.find((o) => o.id === screen.orderId)} driver={tracking?.driver} go={go} />;
  else if (screen.name === "orders") body = <OrdersScreen orders={orders} go={go} reorder={reorder} onReview={submitReview} />;
  else if (screen.name === "favorites") body = <FavoritesScreen db={db} favorites={favorites} toggleFavorite={toggleFavorite} go={go} />;
  else if (screen.name === "profile") body = <ProfileScreen user={user} onLogout={onLogout} go={go} />;

  const showBottomNav = ["home", "search", "orders", "favorites", "profile"].includes(screen.name);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg, position: "relative" }}>
      <div style={{ flex: 1, overflowY: "auto" }}>{body}</div>

      {cart.length > 0 && ["home", "search", "store", "product"].includes(screen.name) && (
        <button onClick={() => go("cart")} style={{ position: "absolute", bottom: showBottomNav ? 78 : 16, left: 16, right: 16, background: C.primary, color: "#fff", border: "none", borderRadius: 16, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 8px 20px rgba(75,107,51,.35)", cursor: "pointer", fontFamily: "inherit" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 14.5 }}><ShoppingCart size={18} /> عرض السلة ({cartCount})</span>
          <span style={{ fontWeight: 800 }}>{money(cartSubtotal)}</span>
        </button>
      )}

      {toast && (
        <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", background: C.text, color: "#fff", padding: "9px 16px", borderRadius: 12, fontSize: 13, fontWeight: 700, zIndex: 50, maxWidth: "88%", textAlign: "center" }}>{toast}</div>
      )}

      {showBottomNav && (
        <div style={{ display: "flex", borderTop: `1px solid ${C.border}`, background: C.surface, padding: "8px 4px" }}>
          {[
            { id: "home", label: "الرئيسية", Icon: Home },
            { id: "search", label: "البحث", Icon: Search },
            { id: "orders", label: "طلباتي", Icon: ShoppingBag },
            { id: "favorites", label: "المفضلة", Icon: Heart },
            { id: "profile", label: "حسابي", Icon: User },
          ].map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); go(t.id); }} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 0", color: screen.name === t.id ? C.primary : C.textMuted, fontFamily: "inherit" }}>
              <t.Icon size={21} strokeWidth={screen.name === t.id ? 2.4 : 2} />
              <span style={{ fontSize: 10.5, fontWeight: 700 }}>{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HomeScreen({ user, db, go, favorites, toggleFavorite, myOrders, reorder }) {
  const openStores = db.stores.filter((s) => s.isOpen);
  const popular = [...db.stores].sort((a, b) => b.rating - a.rating).slice(0, 4);
  const lastOrder = myOrders[0];
  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ padding: "16px 16px 4px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>أهلًا بك، {user.name?.split(" ")[0] || "بك"} 👋</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.textMuted, fontSize: 12.5, marginTop: 3 }}><MapPin size={13} /> قرية عقربا</div>
        </div>
        <button style={{ width: 38, height: 38, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Bell size={17} color={C.text} /></button>
      </div>

      <div style={{ padding: 16 }}>
        <button onClick={() => go("search")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "13px 15px", cursor: "pointer", color: C.textMuted, fontFamily: "inherit", fontSize: 14 }}>
          <Search size={17} /> ماذا تريد أن تطلب؟
        </button>
      </div>

      <div style={{ padding: "0 16px" }}>
        <SectionTitle title="الأقسام" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => go("search", { category: c.id })} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              <div style={{ width: 54, height: 54, borderRadius: 16, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center" }}><c.Icon size={22} color={C.primary} /></div>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: C.text, textAlign: "center" }}>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "22px 16px 0" }}>
        <SectionTitle title="الأكثر طلبًا" />
        <HScroll>{popular.map((s) => <StoreCard key={s.id} store={s} go={go} isFav={favorites.has(s.id)} toggleFavorite={toggleFavorite} />)}</HScroll>
      </div>

      <div style={{ padding: "22px 16px 0" }}>
        <SectionTitle title="محلات قريبة منك" />
        <HScroll>{openStores.map((s) => <StoreCard key={s.id} store={s} go={go} isFav={favorites.has(s.id)} toggleFavorite={toggleFavorite} />)}</HScroll>
      </div>

      <div style={{ margin: "22px 16px 0", background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, borderRadius: 18, padding: 18, color: "#fff" }}>
        <div style={{ fontWeight: 800, fontSize: 15.5 }}>عروض اليوم 🎉</div>
        <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>توصيل مجاني عند الطلب من مخبز البلد اليوم</div>
      </div>

      {lastOrder && (
        <div style={{ padding: "22px 16px 0" }}>
          <SectionTitle title="اطلب من جديد" />
          <div onClick={() => reorder(lastOrder)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{lastOrder.storeName}</div>
              <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 2 }}>{lastOrder.items.length} منتجات · {money(lastOrder.total)}</div>
            </div>
            <div style={{ color: C.primary, display: "flex", alignItems: "center", gap: 5, fontWeight: 700, fontSize: 13 }}><RefreshCw size={15} /> إعادة الطلب</div>
          </div>
        </div>
      )}
    </div>
  );
}
function SectionTitle({ title }) { return <div style={{ fontWeight: 800, fontSize: 15.5, color: C.text, marginBottom: 10 }}>{title}</div>; }
function HScroll({ children }) { return <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6, marginRight: -16, paddingRight: 16, marginLeft: -16, paddingLeft: 16 }}>{children}</div>; }

function StoreCard({ store, go, isFav, toggleFavorite, wide }) {
  return (
    <div onClick={() => go("store", { storeId: store.id })} style={{ minWidth: wide ? "100%" : 172, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", cursor: "pointer", flexShrink: 0 }}>
      <div style={{ height: 84, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, position: "relative" }}>
        {store.cover}
        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(store.id); }} style={{ position: "absolute", top: 8, left: 8, background: "rgba(255,255,255,.9)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Heart size={14} color={isFav ? C.danger : C.textMuted} fill={isFav ? C.danger : "none"} />
        </button>
        {!store.isOpen && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontWeight: 700, fontSize: 11.5, background: "rgba(0,0,0,.4)", padding: "3px 10px", borderRadius: 999 }}>مغلق حاليًا</span></div>}
      </div>
      <div style={{ padding: 11 }}>
        <div style={{ fontWeight: 800, fontSize: 13.5, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{store.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 11.5, color: C.textMuted }}>
          <Star size={12} color={C.accent} fill={C.accent} /> {store.rating} · {store.deliveryTime}
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>رسوم التوصيل {money(store.deliveryFee)}</div>
      </div>
    </div>
  );
}

function SearchScreen({ db, go, category }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(category || null);
  const [recent, setRecent] = useState(["برجر", "خبز طابون", "كنافة"]);
  const filteredStores = db.stores.filter((s) => (!cat || s.category === cat) && (!q || s.name.includes(q)));
  const filteredProducts = q ? db.products.filter((p) => p.name.includes(q) || p.description.includes(q)) : [];

  return (
    <div>
      <TopHeader title="البحث" onBack={() => go("home")} />
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "11px 14px" }}>
          <Search size={17} color={C.textMuted} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن محل أو منتج" style={{ border: "none", outline: "none", flex: 1, fontFamily: "inherit", fontSize: 14, background: "transparent", color: C.text }} />
          {q && <button onClick={() => { setRecent((r) => [q, ...r.filter((x) => x !== q)].slice(0, 5)); setQ(""); }} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} color={C.textMuted} /></button>}
        </div>

        {!q && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.textMuted, marginBottom: 8 }}>عمليات بحث سابقة</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {recent.map((r, i) => <button key={i} onClick={() => setQ(r)} style={{ padding: "7px 13px", borderRadius: 999, background: C.primaryLight, border: "none", cursor: "pointer", fontSize: 12.5, color: C.primaryDark, fontWeight: 600, fontFamily: "inherit" }}>{r}</button>)}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginTop: 16, paddingBottom: 4 }}>
          <FilterChip active={!cat} onClick={() => setCat(null)}>الكل</FilterChip>
          {CATEGORIES.map((c) => <FilterChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.name}</FilterChip>)}
        </div>

        {q && filteredProducts.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <SectionTitle title="منتجات" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredProducts.map((p) => <ProductRow key={p.id} product={p} onClick={() => go("product", { productId: p.id, storeId: p.storeId })} />)}
            </div>
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <SectionTitle title="محلات" />
          {filteredStores.length === 0 ? <EmptyState icon={Search} title="لا توجد نتائج" sub="جرّب كلمة بحث أخرى أو قسمًا مختلفًا" /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredStores.map((s) => <StoreCard key={s.id} store={s} go={go} isFav={false} toggleFavorite={() => {}} wide />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function FilterChip({ active, onClick, children }) {
  return <button onClick={onClick} style={{ flexShrink: 0, padding: "8px 15px", borderRadius: 999, border: `1.5px solid ${active ? C.primary : C.border}`, background: active ? C.primary : C.surface, color: active ? "#fff" : C.text, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{children}</button>;
}
function ProductRow({ product, onClick, right }) {
  return (
    <div onClick={onClick} style={{ display: "flex", gap: 12, alignItems: "center", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 10, cursor: onClick ? "pointer" : "default" }}>
      <div style={{ width: 54, height: 54, borderRadius: 12, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{product.image}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: C.text }}>{product.name}</div>
        <div style={{ fontSize: 12, color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.description}</div>
        <div style={{ fontWeight: 800, fontSize: 13, color: C.primaryDark, marginTop: 3 }}>{money(product.price)}</div>
      </div>
      {right}
    </div>
  );
}

function StorePage({ store, products, go, isFav, toggleFavorite }) {
  if (!store) return <EmptyState icon={StoreIcon} title="المحل غير موجود" />;
  const groups = {};
  products.forEach((p) => { (groups[p.category] = groups[p.category] || []).push(p); });
  return (
    <div>
      <div style={{ height: 150, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, position: "relative" }}>
        {store.cover}
        <button onClick={() => go("home")} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,.92)", border: "none", borderRadius: 12, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ChevronRight size={19} /></button>
        <button onClick={() => toggleFavorite(store.id)} style={{ position: "absolute", top: 14, left: 14, background: "rgba(255,255,255,.92)", border: "none", borderRadius: 12, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Heart size={16} color={isFav ? C.danger : C.text} fill={isFav ? C.danger : "none"} /></button>
      </div>
      <div style={{ padding: 16, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontWeight: 800, fontSize: 19, color: C.text }}>{store.name}</div>
          {store.isOpen ? <Badge tone="success">مفتوح</Badge> : <Badge tone="danger">مغلق</Badge>}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 12.5, color: C.textMuted, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Star size={13} color={C.accent} fill={C.accent} /> {store.rating}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={13} /> {store.deliveryTime}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Truck size={13} /> {money(store.deliveryFee)}</span>
        </div>
        {store.minOrder > 0 && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>الحد الأدنى للطلب: {money(store.minOrder)}</div>}
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 20 }}>
        {!store.isOpen && <div style={{ background: C.dangerBg, color: C.danger, borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 700 }}>هذا المحل مغلق حاليًا ولا يستقبل طلبات جديدة</div>}
        {Object.entries(groups).map(([cat, items]) => (
          <div key={cat}>
            <SectionTitle title={cat} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((p) => <ProductRow key={p.id} product={p} onClick={() => go("product", { productId: p.id, storeId: store.id })} right={<div style={{ width: 30, height: 30, borderRadius: 9, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={16} color={C.primary} /></div>} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductScreen({ product, storeId, go, addToCart }) {
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState({});
  const [notes, setNotes] = useState("");
  if (!product) return <EmptyState icon={Package} title="المنتج غير متاح" />;

  function pick(optId, choice, type) {
    setSelected((s) => {
      const cur = s[optId] || [];
      if (type === "single") return { ...s, [optId]: [choice] };
      const exists = cur.find((c) => c.name === choice.name);
      return { ...s, [optId]: exists ? cur.filter((c) => c.name !== choice.name) : [...cur, choice] };
    });
  }

  const optionsFlat = Object.values(selected).flat();
  const unitPrice = product.price + optionsFlat.reduce((a, o) => a + o.price, 0);
  const requiredMissing = (product.options || []).some((o) => o.required && !(selected[o.id] || []).length);

  return (
    <div>
      <TopHeader title="تفاصيل المنتج" onBack={() => go("store", { storeId })} />
      <div style={{ height: 160, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 68 }}>{product.image}</div>
      <div style={{ padding: 18 }}>
        <div style={{ fontWeight: 800, fontSize: 19, color: C.text }}>{product.name}</div>
        <div style={{ color: C.textMuted, fontSize: 13.5, marginTop: 6, lineHeight: 1.7 }}>{product.description}</div>
        <div style={{ fontWeight: 800, fontSize: 17, color: C.primaryDark, marginTop: 10 }}>{money(product.price)}</div>

        {(product.options || []).map((opt) => (
          <div key={opt.id} style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{opt.name}</div>
              {opt.required && <Badge tone="warning">إلزامي</Badge>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {opt.choices.map((c) => {
                const isSel = (selected[opt.id] || []).some((x) => x.name === c.name);
                return (
                  <button key={c.name} onClick={() => pick(opt.id, c, opt.type)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${isSel ? C.primary : C.border}`, background: isSel ? C.primaryLight : C.surface, cursor: "pointer", fontFamily: "inherit" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 17, height: 17, borderRadius: opt.type === "single" ? "50%" : 5, border: `2px solid ${isSel ? C.primary : C.border}`, background: isSel ? C.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{isSel && <Check size={11} color="#fff" />}</span>
                      {c.name}
                    </span>
                    <span style={{ fontSize: 12.5, color: C.textMuted }}>{c.price > 0 ? `+${money(c.price)}` : "مجانًا"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>ملاحظات</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="مثال: بدون بصل" rows={2} style={{ ...inputStyle, resize: "none" }} />
        </div>

        <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={qtyBtnStyle}><Minus size={17} /></button>
          <span style={{ fontWeight: 800, fontSize: 17, minWidth: 20, textAlign: "center" }}>{qty}</span>
          <button onClick={() => setQty((q) => q + 1)} style={qtyBtnStyle}><Plus size={17} /></button>
        </div>
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${C.border}` }}>
        <Btn full size="lg" disabled={requiredMissing} onClick={() => { addToCart({ productId: product.id, storeId, name: product.name, price: unitPrice, qty, options: optionsFlat, notes }); go("store", { storeId }); }}>
          إضافة إلى السلة · {money(unitPrice * qty)}
        </Btn>
      </div>
    </div>
  );
}
const qtyBtnStyle = { width: 38, height: 38, borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };

function CartScreen({ cart, store, updateQty, removeItem, subtotal, go }) {
  if (cart.length === 0) return (<div><TopHeader title="سلة الطلب" onBack={() => go("home")} /><EmptyState icon={ShoppingCart} title="سلة الطلبات فارغة" sub="تصفح المحلات وابدأ بإضافة منتجات" action={<div style={{ marginTop: 10 }}><Btn onClick={() => go("home")}>تصفح المحلات</Btn></div>} /></div>);
  const total = subtotal + (store?.deliveryFee || 0);
  const belowMin = store && store.minOrder > subtotal;
  return (
    <div>
      <TopHeader title="سلة الطلب" onBack={() => go("store", { storeId: store?.id })} />
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>{store?.cover} {store?.name}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {cart.map((item, idx) => (
            <div key={idx} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{item.name}</div>
                <button onClick={() => removeItem(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: C.danger }}><Trash2 size={16} /></button>
              </div>
              {item.options?.length > 0 && <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 3 }}>{item.options.map((o) => o.name).join("، ")}</div>}
              {item.notes && <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 2 }}>ملاحظة: {item.notes}</div>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button onClick={() => updateQty(idx, -1)} style={{ ...qtyBtnStyle, width: 28, height: 28 }}><Minus size={13} /></button>
                  <span style={{ fontWeight: 700, fontSize: 13.5 }}>{item.qty}</span>
                  <button onClick={() => updateQty(idx, 1)} style={{ ...qtyBtnStyle, width: 28, height: 28 }}><Plus size={13} /></button>
                </div>
                <div style={{ fontWeight: 800, color: C.primaryDark, fontSize: 13.5 }}>{money(item.qty * item.price)}</div>
              </div>
            </div>
          ))}
        </div>

        {belowMin && <div style={{ marginTop: 14, background: C.warningBg, color: C.warning, borderRadius: 12, padding: 11, fontSize: 12.5, fontWeight: 700 }}>الحد الأدنى للطلب من هذا المحل هو {money(store.minOrder)}</div>}

        <div style={{ marginTop: 18, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          <Row label="المجموع الفرعي" value={money(subtotal)} />
          <Row label="رسوم التوصيل" value={money(store?.deliveryFee || 0)} />
          <div style={{ borderTop: `1px dashed ${C.border}`, margin: "4px 0" }} />
          <Row label="الإجمالي" value={money(total)} bold />
        </div>

        <div style={{ marginTop: 14, background: C.primaryLight, borderRadius: 14, padding: 13, display: "flex", alignItems: "center", gap: 10 }}>
          <CircleDollarSign size={19} color={C.primaryDark} />
          <div style={{ fontSize: 12.5, color: C.primaryDark, fontWeight: 700 }}>الدفع عند الاستلام 💵 — ستدفع للمندوب نقدًا عند استلام طلبك</div>
        </div>
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${C.border}` }}>
        <Btn full size="lg" disabled={belowMin} onClick={() => go("checkout")}>متابعة الطلب · {money(total)}</Btn>
      </div>
    </div>
  );
}
function Row({ label, value, bold }) {
  return <div style={{ display: "flex", justifyContent: "space-between", fontSize: bold ? 15 : 13.5, fontWeight: bold ? 800 : 600, color: bold ? C.text : C.textMuted }}><span>{label}</span><span style={{ color: bold ? C.text : C.text }}>{value}</span></div>;
}

function CheckoutScreen({ store, subtotal, user, go, placeOrder }) {
  const [area, setArea] = useState(AREAS[0]);
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [addrNotes, setAddrNotes] = useState("");
  const [phone, setPhone] = useState(user.phone || "");
  const [orderNotes, setOrderNotes] = useState("");
  const [outOfZone, setOutOfZone] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const total = subtotal + (store?.deliveryFee || 0);

  function confirm() {
    setPhoneError("");
    if (area === "خارج عقربا") { setOutOfZone(true); return; }
    if (!street || !phone) return;
    if (!PHONE_HINT_REGEX.test(phone.trim())) { setPhoneError("رقم الهاتف غير صحيح — استخدم صيغة فلسطينية أو إسرائيلية مثل 0599123456"); return; }
    placeOrder({ area, street, landmark, notes: addrNotes }, phone.trim(), orderNotes);
  }

  return (
    <div>
      <TopHeader title="إتمام الطلب" onBack={() => go("cart")} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        {outOfZone && (
          <div style={{ background: C.dangerBg, borderRadius: 14, padding: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <AlertCircle size={18} color={C.danger} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 13, color: C.danger, fontWeight: 700 }}>عذرًا، طلبك خارج نطاق التوصيل في عقربا. يرجى اختيار منطقة داخل القرية لإتمام الطلب.</div>
          </div>
        )}
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 10 }}>عنوان التوصيل</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Field label="المنطقة">
              <select value={area} onChange={(e) => { setArea(e.target.value); setOutOfZone(false); }} style={inputStyle}>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="الشارع"><input value={street} onChange={(e) => setStreet(e.target.value)} style={inputStyle} placeholder="اسم الشارع" /></Field>
            <Field label="أقرب معلم"><input value={landmark} onChange={(e) => setLandmark(e.target.value)} style={inputStyle} placeholder="مثال: بالقرب من المسجد الكبير" /></Field>
            <Field label="وصف إضافي للموقع"><input value={addrNotes} onChange={(e) => setAddrNotes(e.target.value)} style={inputStyle} placeholder="مثال: الطابق الثاني، الباب الأزرق" /></Field>
          </div>
        </div>
        <Field label="رقم الهاتف">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} placeholder="0599123456" dir="ltr" />
          {phoneError && <div style={{ color: C.danger, fontSize: 12, marginTop: 5 }}>{phoneError}</div>}
        </Field>
        <Field label="ملاحظات الطلب (اختياري)"><textarea value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} rows={2} style={{ ...inputStyle, resize: "none" }} placeholder="أي ملاحظات إضافية للمحل أو المندوب" /></Field>

        <div>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 10 }}>ملخص الطلب</div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <Row label="المجموع الفرعي" value={money(subtotal)} />
            <Row label="رسوم التوصيل" value={money(store?.deliveryFee || 0)} />
            <div style={{ borderTop: `1px dashed ${C.border}`, margin: "4px 0" }} />
            <Row label="الإجمالي" value={money(total)} bold />
          </div>
        </div>

        <div style={{ background: C.primaryLight, borderRadius: 14, padding: 13, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13.5, fontWeight: 800, color: C.primaryDark }}>طريقة الدفع</span>
          <span style={{ fontSize: 13.5, fontWeight: 800, color: C.primaryDark }}>الدفع عند الاستلام 💵</span>
        </div>
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${C.border}` }}>
        <Btn full size="lg" onClick={confirm} disabled={!street || !phone}>تأكيد الطلب</Btn>
      </div>
    </div>
  );
}

function SuccessScreen({ orderId, go }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, textAlign: "center", gap: 12 }}>
      <div style={{ width: 84, height: 84, borderRadius: "50%", background: C.successBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🎉</div>
      <div style={{ fontWeight: 800, fontSize: 20, color: C.text }}>تم استلام طلبك</div>
      <div style={{ color: C.textMuted, fontSize: 13.5 }}>رقم الطلب: #{orderId.replace("o", "")}</div>
      <Badge tone="default">الدفع عند الاستلام 💵</Badge>
      <div style={{ width: "100%", marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
        <Btn full size="lg" onClick={() => go("tracking", { orderId })}>تتبع الطلب</Btn>
        <Btn full variant="ghost" onClick={() => go("home")}>العودة للرئيسية</Btn>
      </div>
    </div>
  );
}

function TrackingScreen({ order, driver, go }) {
  if (!order) return <EmptyState icon={Package} title="لم يتم العثور على الطلب" />;
  return (
    <div>
      <TopHeader title={`تتبع الطلب #${order.id.replace("o", "")}`} onBack={() => go("orders")} />
      <div style={{ padding: 16 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 800, fontSize: 14.5 }}>{order.storeName}</div>
            <div style={{ fontWeight: 800, fontSize: 14.5, color: C.primaryDark }}>{money(order.total)}</div>
          </div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{order.items.length} منتجات · وقت الوصول المتوقع: 30-40 دقيقة</div>
        </div>

        <Timeline status={order.status} />

        {["ASSIGNED", "PICKED_UP", "ON_THE_WAY"].includes(order.status) && driver && (
          <div style={{ marginTop: 10, background: C.primaryLight, borderRadius: 16, padding: 14 }}>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>مندوب التوصيل</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.surface, display: "flex", alignItems: "center", justifyContent: "center" }}><Bike size={19} color={C.primary} /></div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{driver.name}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={`tel:${driver.phone}`} style={{ width: 36, height: 36, borderRadius: 10, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", color: C.primary }}><Phone size={16} /></a>
                <button style={{ width: 36, height: 36, borderRadius: 10, background: C.surface, border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: C.primary, cursor: "pointer" }}><MessageCircle size={16} /></button>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 18, fontSize: 12.5, color: C.textMuted }}>
          العنوان: {order.address.area} - {order.address.street} {order.address.landmark && `(${order.address.landmark})`}
        </div>
      </div>
    </div>
  );
}

function OrdersScreen({ orders, go, reorder, onReview }) {
  const [tab, setTab] = useState("current");
  const current = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status));
  const past = orders.filter((o) => ["DELIVERED", "CANCELLED"].includes(o.status));
  const list = tab === "current" ? current : past;
  return (
    <div>
      <TopHeader title="طلباتي" />
      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "flex", background: C.surface, borderRadius: 12, padding: 4, border: `1px solid ${C.border}` }}>
          <button onClick={() => setTab("current")} style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13.5, background: tab === "current" ? C.primary : "transparent", color: tab === "current" ? "#fff" : C.textMuted, fontFamily: "inherit" }}>الحالية ({current.length})</button>
          <button onClick={() => setTab("past")} style={{ flex: 1, padding: "9px 0", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13.5, background: tab === "past" ? C.primary : "transparent", color: tab === "past" ? "#fff" : C.textMuted, fontFamily: "inherit" }}>السابقة ({past.length})</button>
        </div>
      </div>
      <div style={{ padding: 16 }}>
        {list.length === 0 ? <EmptyState icon={ClipboardList} title="لا توجد طلبات حتى الآن" sub="ستظهر طلباتك هنا بعد إتمام أول طلب" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {list.map((o) => (
              <div key={o.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{o.storeName}</div>
                    <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 3 }}>#{o.id.replace("o", "")} · {new Date(o.createdAt).toLocaleDateString("ar-EG")}</div>
                  </div>
                  <StatusPill status={o.status} />
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 8 }}>{o.items.map((i) => i.name).join("، ")}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>{money(o.total)}</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {!["DELIVERED", "CANCELLED"].includes(o.status) && <Btn size="sm" onClick={() => go("tracking", { orderId: o.id })}>تتبع</Btn>}
                    {["DELIVERED", "CANCELLED"].includes(o.status) && <Btn size="sm" variant="secondary" onClick={() => reorder(o)}>إعادة الطلب</Btn>}
                  </div>
                </div>
                {o.status === "DELIVERED" && !o.review && <RateOrder order={o} onReview={onReview} />}
                {o.review && <div style={{ marginTop: 8, fontSize: 12, color: C.textMuted, display: "flex", alignItems: "center", gap: 4 }}><Star size={13} color={C.accent} fill={C.accent} /> تقييمك: {o.review.rating}/5</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
function RateOrder({ order, onReview }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  return (
    <div style={{ marginTop: 10, borderTop: `1px dashed ${C.border}`, paddingTop: 10 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>قيّم هذا الطلب</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setRating(n)} style={{ background: "none", border: "none", cursor: "pointer" }}><Star size={20} color={C.accent} fill={n <= rating ? C.accent : "none"} /></button>)}
      </div>
      {rating > 0 && (
        <div style={{ display: "flex", gap: 8 }}>
          <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="تعليق اختياري" style={{ ...inputStyle, flex: 1 }} />
          <Btn size="sm" onClick={() => onReview(order.id, rating, comment)}>إرسال</Btn>
        </div>
      )}
    </div>
  );
}
function StatusPill({ status }) {
  const tone = status === "DELIVERED" ? "success" : status === "CANCELLED" ? "danger" : status === "PENDING" ? "warning" : "default";
  return <Badge tone={tone}>{STATUS_LABELS[status]}</Badge>;
}

function FavoritesScreen({ db, favorites, toggleFavorite, go }) {
  const stores = db.stores.filter((s) => favorites.has(s.id));
  return (
    <div>
      <TopHeader title="المفضلة" />
      <div style={{ padding: 16 }}>
        {stores.length === 0 ? <EmptyState icon={Heart} title="لا توجد محلات مفضلة" sub="اضغط على أيقونة القلب في أي محل لإضافته هنا" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {stores.map((s) => <StoreCard key={s.id} store={s} go={go} isFav toggleFavorite={toggleFavorite} wide />)}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileScreen({ user, onLogout, go }) {
  const items = [
    { label: "طلباتي", Icon: ShoppingBag, onClick: () => go("orders") },
    { label: "المفضلة", Icon: Heart, onClick: () => go("favorites") },
    { label: "العناوين", Icon: MapPin },
    { label: "الإشعارات", Icon: Bell },
    { label: "المساعدة", Icon: MessageCircle },
    { label: "الشروط والأحكام", Icon: ClipboardList },
    { label: "سياسة الخصوصية", Icon: ClipboardList },
  ];
  return (
    <div>
      <TopHeader title="حسابي" />
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, marginBottom: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 19 }}>{user.name?.[0] || "?"}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15.5 }}>{user.name}</div>
            <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 2 }} dir="ltr">{user.phone || "—"}</div>
          </div>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
          {items.map((it, i) => (
            <button key={i} onClick={it.onClick} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", border: "none", borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : "none", background: "transparent", cursor: "pointer", fontFamily: "inherit" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, fontWeight: 600, color: C.text }}><it.Icon size={17} color={C.textMuted} /> {it.label}</span>
              <ChevronLeft size={16} color={C.textMuted} />
            </button>
          ))}
        </div>
        <div style={{ marginTop: 16 }}><Btn full variant="danger" icon={LogOut} onClick={onLogout}>تسجيل الخروج</Btn></div>
      </div>
    </div>
  );
}

/* ============================== لوحة صاحب المحل ============================== */
function StoreOwnerApp({ user, onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [store, setStore] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const loadAll = useCallback(async () => {
    setLoadError(null);
    try {
      const [{ store: storeData }, { orders: orderList }, { products: productList }] = await Promise.all([
        api.store(user.storeId), api.storeOrders(), api.storeProducts(),
      ]);
      setStore(storeData);
      setOrders(orderList);
      setProducts(productList);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user.storeId]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => {
    const interval = setInterval(() => { api.storeOrders().then(({ orders: o }) => setOrders(o)).catch(() => {}); }, 8000);
    return () => clearInterval(interval);
  }, []);

  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString());
  const activeOrders = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status));

  async function updateStatus(orderId, status) {
    try {
      const { order } = await api.updateStoreOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? order : o)));
    } catch (err) { window.alert(err.message); }
  }
  async function toggleOpen() {
    try {
      const { store: updated } = await api.updateStoreSettings({ isOpen: !store.isOpen });
      setStore(updated);
    } catch (err) { window.alert(err.message); }
  }
  async function toggleAvailable(pid) {
    const product = products.find((p) => p.id === pid);
    try {
      const { product: updated } = await api.updateProduct(pid, { ...product, available: !product.available });
      setProducts((prev) => prev.map((p) => (p.id === pid ? updated : p)));
    } catch (err) { window.alert(err.message); }
  }
  async function deleteProduct(pid) {
    if (!window.confirm("هل تريد حذف هذا المنتج؟")) return;
    try {
      await api.deleteProduct(pid);
      setProducts((prev) => prev.filter((p) => p.id !== pid));
    } catch (err) { window.alert(err.message); }
  }
  async function saveProduct(prod) {
    try {
      const exists = products.some((p) => p.id === prod.id);
      const { product } = exists ? await api.updateProduct(prod.id, prod) : await api.createProduct(prod);
      setProducts((prev) => (exists ? prev.map((p) => (p.id === prod.id ? product : p)) : [...prev, product]));
    } catch (err) { window.alert(err.message); }
  }
  async function updateStore(patch) {
    try {
      const { store: updated } = await api.updateStoreSettings(patch);
      setStore(updated);
    } catch (err) { window.alert(err.message); }
  }

  if (loading) return <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: 13 }}>جارِ التحميل...</div>;
  if (loadError) return <EmptyState icon={AlertCircle} title="تعذّر الاتصال بالخادم" sub={loadError} action={<div style={{ marginTop: 10 }}><Btn onClick={loadAll}>إعادة المحاولة</Btn></div>} />;

  const salesTotal = orders.filter((o) => o.status === "DELIVERED").reduce((s, o) => s + o.total, 0);

  return (
    <RoleShell
      title={store?.name || "لوحة المحل"}
      subtitle="لوحة تحكم صاحب المحل"
      tabs={[
        { id: "dashboard", label: "نظرة عامة", Icon: LayoutDashboard },
        { id: "orders", label: "الطلبات", Icon: ClipboardList, badge: activeOrders.length },
        { id: "products", label: "المنتجات", Icon: Package },
        { id: "settings", label: "المحل", Icon: Settings },
      ]}
      tab={tab} setTab={setTab} onLogout={onLogout}
    >
      {tab === "dashboard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <StatCard label="طلبات اليوم" value={todayOrders.length} Icon={ClipboardList} />
            <StatCard label="الطلبات الحالية" value={activeOrders.length} Icon={Clock} />
            <StatCard label="إجمالي المبيعات" value={money(salesTotal)} Icon={CircleDollarSign} />
            <StatCard label="عدد المنتجات" value={products.length} Icon={Package} />
          </div>
          <div>
            <SectionTitle title="المنتجات الأكثر طلبًا" />
            <TopProducts orders={orders} />
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {orders.length === 0 && <EmptyState icon={ClipboardList} title="لا توجد طلبات بعد" />}
          {orders.map((o) => <StoreOrderCard key={o.id} order={o} onUpdateStatus={updateStatus} />)}
        </div>
      )}

      {tab === "products" && <ProductsManager products={products} storeId={store.id} onSave={saveProduct} onDelete={deleteProduct} onToggle={toggleAvailable} />}

      {tab === "settings" && store && <StoreSettings store={store} onUpdate={updateStore} onToggleOpen={toggleOpen} />}
    </RoleShell>
  );
}
function StatCard({ label, value, Icon }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 15 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}><Icon size={17} color={C.primary} /></div>
      <div style={{ fontWeight: 800, fontSize: 19, color: C.text }}>{value}</div>
      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{label}</div>
    </div>
  );
}
function TopProducts({ orders }) {
  const counts = {};
  orders.forEach((o) => o.items.forEach((i) => { counts[i.name] = (counts[i.name] || 0) + i.quantity; }));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (top.length === 0) return <EmptyState icon={Package} title="لا توجد بيانات مبيعات بعد" />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {top.map(([name, count]) => (
        <div key={name} style={{ display: "flex", justifyContent: "space-between", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 14px" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{name}</span>
          <Badge>{count} طلب</Badge>
        </div>
      ))}
    </div>
  );
}
const NEXT_STATUS = { PENDING: "CONFIRMED", CONFIRMED: "PREPARING", PREPARING: "READY" };
const NEXT_LABEL = { PENDING: "تأكيد الطلب", CONFIRMED: "بدء التحضير", PREPARING: "الطلب جاهز" };
function StoreOrderCard({ order, onUpdateStatus }) {
  const next = NEXT_STATUS[order.status];
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14 }}>#{order.id.replace("o", "")} · {order.customerName}</div>
          <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {order.address.area} - {order.address.street}</div>
        </div>
        <StatusPill status={order.status} />
      </div>
      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 8 }}>{order.items.map((i) => `${i.name} ×${i.quantity}`).join("، ")}</div>
      {order.orderNotes && <div style={{ fontSize: 12, color: C.warning, marginTop: 4 }}>ملاحظة: {order.orderNotes}</div>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <span style={{ fontWeight: 800 }}>{money(order.total)}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <a href={`tel:${order.phone}`} style={{ width: 32, height: 32, borderRadius: 9, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", color: C.primary }}><Phone size={14} /></a>
          {order.status === "PENDING" && <Btn size="sm" variant="danger" onClick={() => onUpdateStatus(order.id, "CANCELLED")}>رفض</Btn>}
          {next && <Btn size="sm" onClick={() => onUpdateStatus(order.id, next)}>{NEXT_LABEL[order.status]}</Btn>}
        </div>
      </div>
    </div>
  );
}

function ProductsManager({ products, storeId, onSave, onDelete, onToggle }) {
  const [editing, setEditing] = useState(null); // null | 'new' | product
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <Btn size="sm" icon={Plus} onClick={() => setEditing("new")}>إضافة منتج</Btn>
      </div>
      {products.length === 0 ? <EmptyState icon={Package} title="لا توجد منتجات بعد" /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {products.map((p) => (
            <div key={p.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 10, display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{p.image}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{money(p.price)} · {p.category}</div>
              </div>
              <button onClick={() => onToggle(p.id)} title="إخفاء/إظهار" style={{ background: "none", border: "none", cursor: "pointer", color: p.available ? C.success : C.textMuted }}>{p.available ? <Eye size={17} /> : <EyeOff size={17} />}</button>
              <button onClick={() => setEditing(p)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted }}><Pencil size={16} /></button>
              <button onClick={() => onDelete(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.danger }}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
      {editing && <ProductEditor product={editing === "new" ? null : editing} storeId={storeId} onClose={() => setEditing(null)} onSave={(p) => { onSave(p); setEditing(null); }} />}
    </div>
  );
}
function ProductEditor({ product, storeId, onClose, onSave }) {
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price || "");
  const [category, setCategory] = useState(product?.category || "الأكثر مبيعًا");
  const [image, setImage] = useState(product?.image || "🍽️");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 60 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.bg, width: "100%", maxWidth: 480, borderRadius: "20px 20px 0 0", padding: 20, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 14 }}>{product ? "تعديل المنتج" : "إضافة منتج جديد"}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="اسم المنتج"><input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} /></Field>
          <Field label="الوصف"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={{ ...inputStyle, resize: "none" }} /></Field>
          <Field label="السعر (₪)"><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} style={inputStyle} /></Field>
          <Field label="القسم"><input value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle} /></Field>
          <Field label="رمز تعبيري للصورة"><input value={image} onChange={(e) => setImage(e.target.value)} style={inputStyle} /></Field>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <Btn full variant="ghost" onClick={onClose}>إلغاء</Btn>
          <Btn full disabled={!name || !price} onClick={() => onSave({ id: product?.id || "p" + Date.now(), storeId, name, description, price: Number(price), category, image, available: product?.available ?? true, options: product?.options || [] })}>حفظ</Btn>
        </div>
      </div>
    </div>
  );
}
function StoreEditor({ store, onClose, onSave }) {
  const [name, setName] = useState(store?.name || "");
  const [category, setCategory] = useState(store?.category || CATEGORIES[0].id);
  const [phone, setPhone] = useState(store?.phone || "");
  const [address, setAddress] = useState(store?.address || "");
  const [deliveryFee, setDeliveryFee] = useState(store?.deliveryFee ?? 5);
  const [minOrder, setMinOrder] = useState(store?.minOrder ?? 0);
  const [deliveryTime, setDeliveryTime] = useState(store?.deliveryTime || "20-30 دقيقة");
  const [cover, setCover] = useState(store?.cover || "🏪");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [error, setError] = useState("");

  function submit() {
    setError("");
    if (!name.trim()) { setError("اسم المحل مطلوب"); return; }
    if (phone && !PHONE_HINT_REGEX.test(phone.trim())) { setError("رقم هاتف المحل غير صحيح (مثال: 0599123456)"); return; }
    const payload = { id: store?.id, name, category, phone, address, deliveryFee: Number(deliveryFee), minOrder: Number(minOrder), deliveryTime, cover };
    if (!store) { // إضافة محل جديد فقط: يمكن ربطه بحساب صاحب محل جديد اختياريًا
      if (ownerEmail || ownerPassword) {
        if (!ownerEmail.trim() || !ownerPassword.trim()) { setError("إذا أضفت حساب صاحب المحل، لازم بريد إلكتروني وكلمة مرور معًا"); return; }
        if (ownerPassword.trim().length < 6) { setError("كلمة مرور صاحب المحل يجب أن تكون 6 أحرف على الأقل"); return; }
        Object.assign(payload, { ownerName: ownerName || name, ownerEmail: ownerEmail.trim(), ownerPassword: ownerPassword.trim() });
      }
    }
    onSave(payload);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 60 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.bg, width: "100%", maxWidth: 480, borderRadius: "20px 20px 0 0", padding: 20, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 14 }}>{store ? "تعديل المحل" : "إضافة محل جديد"}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="اسم المحل"><input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} /></Field>
          <Field label="التصنيف">
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="رمز تعبيري (شعار مبسّط)"><input value={cover} onChange={(e) => setCover(e.target.value)} style={inputStyle} /></Field>
          <Field label="رقم الهاتف"><input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} placeholder="0599123456" dir="ltr" /></Field>
          <Field label="العنوان"><input value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} placeholder="مثال: حي الوسط، عقربا" /></Field>
          <Field label="رسوم التوصيل (₪)"><input type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} style={inputStyle} /></Field>
          <Field label="الحد الأدنى للطلب (₪)"><input type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} style={inputStyle} /></Field>
          <Field label="مدة التوصيل التقريبية"><input value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} style={inputStyle} /></Field>

          {!store && (
            <>
              <div style={{ borderTop: `1px dashed ${C.border}`, marginTop: 4, paddingTop: 12, fontSize: 12.5, fontWeight: 700, color: C.textMuted }}>حساب صاحب المحل (اختياري — لتسجيل دخوله لاحقًا)</div>
              <Field label="اسم صاحب المحل"><input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} style={inputStyle} /></Field>
              <Field label="بريد صاحب المحل"><input value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} style={inputStyle} dir="ltr" /></Field>
              <Field label="كلمة مرور صاحب المحل"><input type="password" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} style={inputStyle} dir="ltr" /></Field>
            </>
          )}
        </div>
        {error && <div style={{ color: C.danger, fontSize: 13, marginTop: 10, display: "flex", gap: 6, alignItems: "center" }}><AlertCircle size={15} />{error}</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <Btn full variant="ghost" onClick={onClose}>إلغاء</Btn>
          <Btn full onClick={submit}>حفظ</Btn>
        </div>
      </div>
    </div>
  );
}

function DriverEditor({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit() {
    setError("");
    if (!name.trim()) { setError("اسم المندوب مطلوب"); return; }
    if (phone && !PHONE_HINT_REGEX.test(phone.trim())) { setError("رقم الهاتف غير صحيح (مثال: 0599123456)"); return; }
    if ((email || password) && (!email.trim() || !password.trim())) { setError("إذا أضفت حساب دخول، لازم بريد إلكتروني وكلمة مرور معًا"); return; }
    if (password && password.trim().length < 6) { setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    onSave({ name, phone, email: email.trim(), password: password.trim() });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 60 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.bg, width: "100%", maxWidth: 480, borderRadius: "20px 20px 0 0", padding: 20, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 14 }}>إضافة مندوب جديد</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="اسم المندوب"><input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} /></Field>
          <Field label="رقم الهاتف"><input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} placeholder="0599123456" dir="ltr" /></Field>
          <div style={{ borderTop: `1px dashed ${C.border}`, marginTop: 4, paddingTop: 12, fontSize: 12.5, fontWeight: 700, color: C.textMuted }}>حساب الدخول (اختياري — ليدخل المندوب لتطبيقه)</div>
          <Field label="البريد الإلكتروني"><input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} dir="ltr" /></Field>
          <Field label="كلمة المرور"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} dir="ltr" /></Field>
        </div>
        {error && <div style={{ color: C.danger, fontSize: 13, marginTop: 10, display: "flex", gap: 6, alignItems: "center" }}><AlertCircle size={15} />{error}</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <Btn full variant="ghost" onClick={onClose}>إلغاء</Btn>
          <Btn full onClick={submit}>حفظ</Btn>
        </div>
      </div>
    </div>
  );
}
function StoreSettings({ store, onUpdate, onToggleOpen }) {
  const [fee, setFee] = useState(store.deliveryFee);
  const [min, setMin] = useState(store.minOrder);
  const [hours, setHours] = useState(store.deliveryTime);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14.5 }}>حالة المحل</div>
          <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{store.isOpen ? "المحل مفتوح ويستقبل الطلبات" : "المحل مغلق حاليًا"}</div>
        </div>
        <Switch on={store.isOpen} onClick={onToggleOpen} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="رسوم التوصيل (₪)"><input type="number" value={fee} onChange={(e) => setFee(e.target.value)} style={inputStyle} /></Field>
        <Field label="الحد الأدنى للطلب (₪)"><input type="number" value={min} onChange={(e) => setMin(e.target.value)} style={inputStyle} /></Field>
        <Field label="مدة التوصيل التقريبية"><input value={hours} onChange={(e) => setHours(e.target.value)} style={inputStyle} /></Field>
        <Btn onClick={() => onUpdate({ deliveryFee: Number(fee), minOrder: Number(min), deliveryTime: hours })}>حفظ التغييرات</Btn>
      </div>
    </div>
  );
}
function Switch({ on, onClick }) {
  return (
    <button onClick={onClick} style={{ width: 46, height: 26, borderRadius: 999, background: on ? C.success : "#D8D3C4", border: "none", cursor: "pointer", position: "relative", flexShrink: 0 }}>
      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, right: on ? 23 : 3, transition: "right .18s" }} />
    </button>
  );
}

/* ============================== تطبيق المندوب ============================== */
function DriverApp({ user, onLogout }) {
  const [tab, setTab] = useState("available");
  const [stores, setStores] = useState([]);
  const [available, setAvailable] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const loadAll = useCallback(async () => {
    setLoadError(null);
    try {
      const [{ stores: storeList }, { orders: avail }, { orders: mine }] = await Promise.all([
        api.stores(), api.availableOrders(), api.myDeliveries(),
      ]);
      setStores(storeList);
      setAvailable(avail);
      setMyOrders(mine);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => {
    const interval = setInterval(loadAll, 8000);
    return () => clearInterval(interval);
  }, [loadAll]);

  const current = myOrders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status));
  const past = myOrders.filter((o) => o.status === "DELIVERED");
  const storeById = (id) => stores.find((s) => s.id === id);

  async function accept(orderId) {
    try {
      await api.acceptOrder(orderId);
      loadAll();
    } catch (err) { window.alert(err.message); }
  }
  async function setStatus(orderId, status) {
    try {
      const { order } = await api.updateDeliveryStatus(orderId, status);
      setMyOrders((prev) => prev.map((o) => (o.id === orderId ? order : o)));
    } catch (err) { window.alert(err.message); }
  }
  async function collectCash(orderId) {
    try {
      const { order } = await api.collectCash(orderId);
      setMyOrders((prev) => prev.map((o) => (o.id === orderId ? order : o)));
    } catch (err) { window.alert(err.message); }
  }

  if (loading) return <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: 13 }}>جارِ التحميل...</div>;
  if (loadError) return <EmptyState icon={AlertCircle} title="تعذّر الاتصال بالخادم" sub={loadError} action={<div style={{ marginTop: 10 }}><Btn onClick={loadAll}>إعادة المحاولة</Btn></div>} />;

  return (
    <RoleShell
      title={user.name}
      subtitle="واجهة المندوب"
      tabs={[
        { id: "available", label: "طلبات متاحة", Icon: Package, badge: available.length },
        { id: "current", label: "طلباتي الحالية", Icon: Bike, badge: current.length },
        { id: "history", label: "السجل والأرباح", Icon: CircleDollarSign },
      ]}
      tab={tab} setTab={setTab} onLogout={onLogout}
    >
      {tab === "available" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {available.length === 0 && <EmptyState icon={Package} title="لا توجد طلبات متاحة حاليًا" sub="ستظهر هنا الطلبات الجاهزة للاستلام من المحلات" />}
          {available.map((o) => {
            const store = storeById(o.storeId);
            return (
              <div key={o.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{store?.name}</div>
                  <span style={{ fontWeight: 800, color: C.primaryDark }}>{money(store?.deliveryFee || 0)}</span>
                </div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><MapPin size={12} /> استلام من: {store?.address}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><MapPin size={12} /> توصيل إلى: {o.address.area} - {o.address.street}</span>
                  <span>قيمة الطلب: {money(o.total)}</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <Btn full onClick={() => accept(o.id)}>قبول الطلب</Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "current" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {current.length === 0 && <EmptyState icon={Bike} title="لا توجد طلبات جارية" />}
          {current.map((o) => <DriverOrderCard key={o.id} order={o} store={storeById(o.storeId)} setStatus={setStatus} collectCash={collectCash} />)}
        </div>
      )}

      {tab === "history" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            <StatCard label="عدد التوصيلات" value={past.length} Icon={Bike} />
            <StatCard label="إجمالي أرباح التوصيل" value={money(past.reduce((s, o) => s + (storeById(o.storeId)?.deliveryFee || 0), 0))} Icon={CircleDollarSign} />
          </div>
          {past.length === 0 ? <EmptyState icon={ClipboardList} title="لا يوجد سجل توصيلات بعد" /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {past.map((o) => (
                <div key={o.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12, display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>#{o.id.replace("o", "")} · {o.storeName}</div>
                    <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 2 }}>{new Date(o.createdAt).toLocaleDateString("ar-EG")}</div>
                  </div>
                  <Badge tone="success">مكتمل</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </RoleShell>
  );
}
const DRIVER_FLOW = { ASSIGNED: { next: "PICKED_UP", label: "وصلت إلى المحل / استلمت الطلب" }, PICKED_UP: { next: "ON_THE_WAY", label: "في الطريق إلى العميل" }, ON_THE_WAY: { next: "DELIVERED", label: "وصلت للعميل" } };
function DriverOrderCard({ order, store, setStatus, collectCash }) {
  const step = DRIVER_FLOW[order.status];
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 800, fontSize: 14 }}>#{order.id.replace("o", "")} · {store?.name}</div>
        <StatusPill status={order.status} />
      </div>
      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><MapPin size={12} /> {order.address.area} - {order.address.street} {order.address.landmark && `(${order.address.landmark})`}</span>
        <span>قيمة الطلب: {money(order.total)} · العميل: {order.customerName}</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <a href={`tel:${order.phone}`} style={{ flex: "0 0 auto", width: 40, height: 40, borderRadius: 12, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", color: C.primary }}><Phone size={17} /></a>
        {order.status !== "DELIVERED" && step && <Btn full onClick={() => setStatus(order.id, step.next)}>{step.label}</Btn>}
      </div>
      {order.status === "DELIVERED" && order.paymentStatus !== "COLLECTED" && (
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <Btn full variant="accent" onClick={() => collectCash(order.id)}>تم تحصيل المبلغ 💵</Btn>
        </div>
      )}
      {order.paymentStatus === "COLLECTED" && <div style={{ marginTop: 10, fontSize: 12.5, color: C.success, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}><Check size={14} /> تم تحصيل المبلغ وإغلاق الطلب</div>}
    </div>
  );
}

/* ============================== لوحة الإدارة ============================== */
function AdminApp({ user, onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stores, setStores] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);
  const [orderFilter, setOrderFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [editingStore, setEditingStore] = useState(null); // null | 'new' | store object
  const [editingDriver, setEditingDriver] = useState(false);

  const loadAll = useCallback(async () => {
    setLoadError(null);
    try {
      const [statsData, { orders: orderList }, { stores: storeList }, { drivers: driverList }, { users: userList }] = await Promise.all([
        api.adminStats(), api.adminOrders(orderFilter), api.adminStores(), api.adminDrivers(), api.adminUsers(),
      ]);
      setStats(statsData);
      setOrders(orderList);
      setStores(storeList);
      setDrivers(driverList);
      setUsers(userList);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderFilter]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function toggleStoreActive(id) {
    const store = stores.find((s) => s.id === id);
    try {
      const { store: updated } = await api.adminSetStoreOpen(id, !store.isOpen);
      setStores((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err) { window.alert(err.message); }
  }
  async function toggleDriverActive(id) {
    const driver = drivers.find((d) => d.id === id);
    try {
      const { driver: updated } = await api.adminSetDriverActive(id, !driver.is_active);
      setDrivers((prev) => prev.map((d) => (d.id === id ? updated : d)));
    } catch (err) { window.alert(err.message); }
  }
  async function toggleUserActive(id) {
    const u = users.find((x) => x.id === id);
    try {
      const { user: updated } = await api.adminSetUserActive(id, !u.is_active);
      setUsers((prev) => prev.map((x) => (x.id === id ? updated : x)));
    } catch (err) { window.alert(err.message); }
  }
  async function saveStore(payload) {
    try {
      if (payload.id) {
        const { store } = await api.adminUpdateStore(payload.id, payload);
        setStores((prev) => prev.map((s) => (s.id === payload.id ? store : s)));
      } else {
        const { store } = await api.adminCreateStore(payload);
        setStores((prev) => [...prev, store]);
      }
      setEditingStore(null);
    } catch (err) { window.alert(err.message); }
  }
  async function deleteStore(id) {
    if (!window.confirm("هل تريد حذف هذا المحل نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    try {
      await api.adminDeleteStore(id);
      setStores((prev) => prev.filter((s) => s.id !== id));
    } catch (err) { window.alert(err.message); }
  }
  async function createDriver(payload) {
    try {
      const { driver } = await api.adminCreateDriver(payload);
      setDrivers((prev) => [...prev, driver]);
      setEditingDriver(false);
    } catch (err) { window.alert(err.message); }
  }

  if (loading) return <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted, fontSize: 13 }}>جارِ التحميل...</div>;
  if (loadError) return <EmptyState icon={AlertCircle} title="تعذّر الاتصال بالخادم" sub={loadError} action={<div style={{ marginTop: 10 }}><Btn onClick={loadAll}>إعادة المحاولة</Btn></div>} />;

  return (
    <RoleShell
      title="لوحة تحكم طلبك"
      subtitle="إدارة عامة"
      tabs={[
        { id: "dashboard", label: "نظرة عامة", Icon: LayoutDashboard },
        { id: "orders", label: "الطلبات", Icon: ClipboardList },
        { id: "stores", label: "المحلات", Icon: StoreIcon },
        { id: "drivers", label: "المندوبين", Icon: Bike },
        { id: "users", label: "العملاء", Icon: Users },
        { id: "settings", label: "الإعدادات", Icon: Settings },
      ]}
      tab={tab} setTab={setTab} onLogout={onLogout}
    >
      {tab === "dashboard" && stats && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <StatCard label="إجمالي الطلبات" value={stats.totalOrders} Icon={ClipboardList} />
            <StatCard label="طلبات اليوم" value={stats.ordersToday} Icon={Clock} />
            <StatCard label="إجمالي المستخدمين" value={stats.totalUsers} Icon={Users} />
            <StatCard label="عدد المحلات" value={stats.totalStores} Icon={StoreIcon} />
            <StatCard label="عدد المندوبين" value={stats.totalDrivers} Icon={Bike} />
            <StatCard label="الطلبات الحالية" value={stats.activeOrders} Icon={Package} />
            <StatCard label="الطلبات المكتملة" value={stats.completedOrders} Icon={Check} />
            <StatCard label="الطلبات الملغاة" value={stats.cancelledOrders} Icon={X} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <StatCard label="إجمالي الإيرادات" value={money(stats.revenue)} Icon={CircleDollarSign} />
            <StatCard label="النقد المحصّل" value={money(stats.cashCollected)} Icon={CircleDollarSign} />
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 12, paddingBottom: 2 }}>
            <FilterChip active={orderFilter === "all"} onClick={() => setOrderFilter("all")}>الكل</FilterChip>
            {["PENDING", "PREPARING", "ON_THE_WAY", "DELIVERED", "CANCELLED"].map((s) => <FilterChip key={s} active={orderFilter === s} onClick={() => setOrderFilter(s)}>{STATUS_LABELS[s]}</FilterChip>)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {orders.length === 0 && <EmptyState icon={ClipboardList} title="لا توجد طلبات مطابقة" />}
            {orders.map((o) => (
              <div key={o.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5 }}>#{o.id.replace("o", "")} · {o.storeName}</div>
                  <StatusPill status={o.status} />
                </div>
                <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 5 }}>العميل: {o.customerName} · المندوب: {drivers.find((d) => d.id === o.driverId)?.name || "لم يُعيَّن"} · {money(o.total)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "stores" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <Btn size="sm" icon={Plus} onClick={() => setEditingStore("new")}>إضافة محل جديد</Btn>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {stores.map((s) => (
              <div key={s.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 26 }}>{s.cover}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{s.name}</div>
                  <div style={{ fontSize: 11.5, color: C.textMuted }}>{CAT_LABEL[s.category]} · {s.address}</div>
                </div>
                <button onClick={() => setEditingStore(s)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted }}><Pencil size={16} /></button>
                <button onClick={() => deleteStore(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.danger }}><Trash2 size={16} /></button>
                <Switch on={s.isOpen} onClick={() => toggleStoreActive(s.id)} />
              </div>
            ))}
          </div>
          {editingStore && <StoreEditor store={editingStore === "new" ? null : editingStore} onClose={() => setEditingStore(null)} onSave={saveStore} />}
        </div>
      )}

      {tab === "drivers" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <Btn size="sm" icon={Plus} onClick={() => setEditingDriver(true)}>إضافة مندوب جديد</Btn>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {drivers.map((d) => (
              <div key={d.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center" }}><Bike size={18} color={C.primary} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{d.name}</div>
                  <div style={{ fontSize: 11.5, color: C.textMuted }} dir="ltr">{d.phone} · {orders.filter((o) => o.driverId === d.id && o.status === "DELIVERED").length} توصيلة</div>
                </div>
                <Switch on={!!d.is_active} onClick={() => toggleDriverActive(d.id)} />
              </div>
            ))}
          </div>
          {editingDriver && <DriverEditor onClose={() => setEditingDriver(false)} onSave={createDriver} />}
        </div>
      )}

      {tab === "users" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {users.length === 0 && <EmptyState icon={Users} title="لا يوجد عملاء مسجّلون بعد" />}
          {users.map((u) => (
            <div key={u.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: C.primary }}>{u.name?.[0] || "?"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{u.name}</div>
                <div style={{ fontSize: 11.5, color: C.textMuted }} dir="ltr">{u.phone} · {u.email}</div>
              </div>
              <Switch on={!!u.is_active} onClick={() => toggleUserActive(u.id)} />
            </div>
          ))}
        </div>
      )}

      {tab === "settings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>منطقة الخدمة</div>
            <div style={{ fontSize: 12.5, color: C.textMuted }}>قرية عقربا فقط — لا يمكن للمستخدمين الطلب خارج هذا النطاق.</div>
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>طريقة الدفع</div>
            <div style={{ fontSize: 12.5, color: C.textMuted }}>الدفع عند الاستلام (نقدًا) هو الخيار الوحيد المتاح في التطبيق.</div>
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>الفئات</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>{CATEGORIES.map((c) => <Badge key={c.id}>{c.name}</Badge>)}</div>
          </div>
        </div>
      )}
    </RoleShell>
  );
}

/* ============================== هيكل عام للوحات (محل / مندوب / إدارة) ============================== */
function RoleShell({ title, subtitle, tabs, tab, setTab, onLogout, children }) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
      <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16.5, color: C.text }}>{title}</div>
          <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 2 }}>{subtitle}</div>
        </div>
        <button onClick={onLogout} style={{ width: 34, height: 34, borderRadius: 10, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.danger }}><LogOut size={15} /></button>
      </div>
      <div style={{ display: "flex", gap: 6, padding: "10px 12px", overflowX: "auto", borderBottom: `1px solid ${C.border}` }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 11, border: `1.5px solid ${tab === t.id ? C.primary : C.border}`, background: tab === t.id ? C.primary : C.surface, color: tab === t.id ? "#fff" : C.text, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5, fontWeight: 700 }}>
            <t.Icon size={14} /> {t.label}
            {!!t.badge && <span style={{ background: tab === t.id ? "rgba(255,255,255,.3)" : C.accent, color: "#fff", borderRadius: 999, fontSize: 10, padding: "1px 6px" }}>{t.badge}</span>}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>{children}</div>
    </div>
  );
}

/* ============================== الجذر ============================== */
export default function TalabakApp() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  // عند فتح التطبيق: إذا كان هناك توكن محفوظ من جلسة سابقة، تحقق من صلاحيته تلقائيًا
  useEffect(() => {
    const token = api.getToken();
    if (!token) { setChecking(false); return; }
    api.me()
      .then(({ user: me }) => setUser(me))
      .catch(() => api.setToken(null))
      .finally(() => setChecking(false));
  }, []);

  function handleLogin({ token, user: loggedInUser }) {
    api.setToken(token);
    setUser(loggedInUser);
  }
  function handleLogout() {
    api.setToken(null);
    setUser(null);
  }

  const shellStyle = {
    fontFamily: "'Tajawal', sans-serif", direction: "rtl", width: "100%", maxWidth: 460, height: "100vh", maxHeight: 880,
    margin: "0 auto", background: C.bg, borderRadius: 18, overflow: "hidden", boxShadow: "0 0 0 1px #00000008, 0 20px 50px rgba(0,0,0,.08)", position: "relative", color: C.text,
  };

  return (
    <div style={{ background: "#F1EDE0", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
        * { box-sizing: border-box; }
        input, textarea, select { font-family: 'Tajawal', sans-serif; }
        ::placeholder { color: ${C.textMuted}; opacity: .8; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        div::-webkit-scrollbar { width: 0; height: 0; }
      `}</style>
      <div style={shellStyle}>
        {checking ? (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 40 }}>🛵</div>
            <div style={{ color: C.textMuted, fontSize: 13 }}>جارِ التحميل...</div>
          </div>
        ) : !user ? (
          <LoginScreen onLogin={handleLogin} />
        ) : user.role === "customer" ? (
          <CustomerApp user={user} onLogout={handleLogout} />
        ) : user.role === "store_owner" ? (
          <StoreOwnerApp user={user} onLogout={handleLogout} />
        ) : user.role === "driver" ? (
          <DriverApp user={user} onLogout={handleLogout} />
        ) : (
          <AdminApp user={user} onLogout={handleLogout} />
        )}
      </div>
    </div>
  );
}
