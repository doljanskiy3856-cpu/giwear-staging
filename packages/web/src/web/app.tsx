import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import { Provider } from "./components/provider";
import { AgentFeedback } from "@runablehq/website-runtime";
import { CartProvider } from "./context/CartContext";
import { MenuProvider } from "./context/MenuContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import CartDrawer from "./components/CartDrawer";
import FloatingContact from "./components/FloatingContact";

// Eagerly load the most critical page
import HomePage from "./pages/index";

// Lazy-load heavy pages — each gets its own JS chunk
const CategoryPage    = lazy(() => import("./pages/CategoryPage"));
const ProductPage     = lazy(() => import("./pages/ProductPage"));
const TrainersPage    = lazy(() => import("./pages/TrainersPage"));
const DeliveryPage    = lazy(() => import("./pages/DeliveryPage"));
const ContactsPage    = lazy(() => import("./pages/ContactsPage"));
const CheckoutPage    = lazy(() => import("./pages/CheckoutPage"));
const PublicOfferPage = lazy(() => import("./pages/PublicOfferPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));

// Minimal spinner shown while a lazy chunk is loading
function PageLoader() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#E8232A] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <Provider>
      <CartProvider>
        <MenuProvider>
        <div className="min-h-screen bg-[#0F0F0F] flex flex-col">
          <ScrollToTop />
          <Header />
          <CartDrawer />
          <main className="flex-1">
            <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/category/karate" component={() => <CategoryPage category="karate" />} />
              <Route path="/category/judo" component={() => <CategoryPage category="judo" />} />
              <Route path="/category/bjj" component={() => <CategoryPage category="bjj" />} />
              <Route path="/category/sambo" component={() => <CategoryPage category="sambo" />} />
              <Route path="/category/aikido" component={() => <CategoryPage category="aikido" />} />
              <Route path="/category/children" component={() => <CategoryPage category="children" />} />
              <Route path="/category/dytiachy" component={() => <CategoryPage category="dytiachy" />} />
              <Route path="/category/accessories" component={() => <CategoryPage category="accessories" />} />
              <Route path="/category/brand" component={() => <CategoryPage category="brand" />} />
              <Route path="/category/bags" component={() => <CategoryPage category="bags" />} />
              <Route path="/category/trainers" component={() => <CategoryPage category="trainers" />} />
              <Route path="/product/:id">
                {(params) => <ProductPage id={params.id} />}
              </Route>
              <Route path="/trenery" component={TrainersPage} />
              <Route path="/dostavka" component={DeliveryPage} />
              <Route path="/kontakty" component={ContactsPage} />
              <Route path="/checkout" component={CheckoutPage} />
              <Route path="/offer" component={PublicOfferPage} />
              <Route path="/privacy" component={PrivacyPolicyPage} />
              <Route>
                <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center pt-16">
                  <div className="text-center">
                    <p className="font-unbounded text-[#E8232A] text-8xl font-black mb-4">404</p>
                    <h1 className="font-unbounded text-white text-2xl font-black mb-4">Сторінку не знайдено</h1>
                    <a href="/" className="bg-[#E8232A] text-white font-bold font-inter px-8 py-3 rounded inline-block">
                      На головну
                    </a>
                  </div>
                </div>
              </Route>
            </Switch>
            </Suspense>
          </main>
          <Footer />
          <FloatingContact />
        </div>
        </MenuProvider>
        {import.meta.env.DEV && <AgentFeedback />}
      </CartProvider>
    </Provider>
  );
}

export default App;
