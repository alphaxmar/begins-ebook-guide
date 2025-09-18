import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from './lib/api';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Books from './pages/Books';
import BookDetail from './pages/BookDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Library from './pages/Library';
import Profile from './pages/Profile';
import SellerDashboard from './pages/SellerDashboard';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <Router>
              <div className="min-h-screen bg-gray-50">
                <Header />
                <main>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/books" element={<Books />} />
                    <Route path="/books/:id" element={<BookDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/library" element={<Library />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/seller" element={<SellerDashboard />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </Router>
          </CartProvider>
        </AuthProvider>
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
