'use client';

import { useState, useEffect, useCallback, FC, ChangeEvent, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Search, MapPin, Star, ChefHat, Sparkles, Baby, Heart, 
  Users, GraduationCap, Home, LogIn, User, Shield, Phone, Mail, 
  Calendar, DollarSign, CheckCircle, XCircle, Menu, X, Briefcase,
  ArrowRight, LogOut, LucideIcon
} from 'lucide-react';

// Import SCSS styles
import './styles/index.scss';

// Import Types
import { 
  Partner, Booking, DashboardStats, 
  LoginForm, RegisterForm, BookingForm 
} from '@/lib/types';

// Service Category Interface
interface ServiceCategoryUI {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

// User type for frontend
interface UserState {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'partner';
  location?: string;
  services?: string[];
  experience?: string;
  address?: string;
  availability?: string;
  pricing?: string;
  rating?: number;
  totalEarnings?: number;
  pendingEarnings?: number;
}

const SERVICE_CATEGORIES: ServiceCategoryUI[] = [
  { id: 'cook', name: 'Cook', icon: ChefHat, color: 'bg-orange-100 text-orange-600', description: 'Professional cooks' },
  { id: 'maid', name: 'Maid', icon: Sparkles, color: 'bg-blue-100 text-blue-600', description: 'Cleaning services' },
  { id: 'nanny', name: 'Nanny', icon: Baby, color: 'bg-pink-100 text-pink-600', description: 'Childcare experts' },
  { id: 'nurse', name: 'Nurse', icon: Heart, color: 'bg-red-100 text-red-600', description: 'Medical care' },
  { id: 'oldagecare', name: 'Old Age Care', icon: Users, color: 'bg-purple-100 text-purple-600', description: 'Elderly assistance' },
  { id: 'hometutor', name: 'Home Tutor', icon: GraduationCap, color: 'bg-green-100 text-green-600', description: 'Private tutoring' },
  { id: 'househelp', name: 'House Help', icon: Home, color: 'bg-teal-100 text-teal-600', description: 'General assistance' },
];

const App: FC = () => {
  // State
  const [user, setUser] = useState<UserState | null>(null);
  const [location, setLocation] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'search' | 'bookings' | 'dashboard'>('home');
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);
  const [showBookingDialog, setShowBookingDialog] = useState<boolean>(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [locationPermissionAsked, setLocationPermissionAsked] = useState<boolean>(false);

  // Form states
  const [loginForm, setLoginForm] = useState<LoginForm>({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    name: '', phone: '', email: '', password: '', location: '',
    services: [], experience: '', address: '', availability: 'Full Time', pricing: '500'
  });
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    scheduledDate: '', scheduledTime: '10:00 AM', address: '', notes: ''
  });

  // IP-based location fallback
  const fetchIPLocation = async (): Promise<void> => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      if (data && data.city) {
        const locationName = `${data.city}${data.region ? ', ' + data.region : ''}`;
        setLocation(locationName);
      } else {
        setLocation('Location not available');
      }
    } catch (e) {
      setLocation('Location not available');
    }
  };

  // Request location
  const requestLocation = useCallback((): void => {
    setLocation('Detecting...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position: GeolocationPosition) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
            );
            const data = await response.json();
            if (data && data.address) {
              const city = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.county || '';
              const state = data.address.state || '';
              const locationName = city ? `${city}${state ? ', ' + state : ''}` : `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
              setLocation(locationName);
              toast.success(`Location: ${locationName}`);
            } else {
              setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
            }
          } catch (e) {
            console.log('Geocoding error:', e);
            setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
          }
        },
        (error: GeolocationPositionError) => {
          console.log('Location error:', error);
          fetchIPLocation();
        }
      );
    } else {
      fetchIPLocation();
    }
  }, []);

  // Load user from localStorage
  useEffect(() => {
    const token = localStorage.getItem('carche_token');
    const userData = localStorage.getItem('carche_user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    fetchPartners();
  }, []);

  // Location permission on first load
  useEffect(() => {
    if (!locationPermissionAsked) {
      requestLocation();
      setLocationPermissionAsked(true);
    }
  }, [locationPermissionAsked, requestLocation]);

  // Fetch partners
  const fetchPartners = async (): Promise<void> => {
    try {
      const res = await fetch('/api/partners');
      const data = await res.json();
      setPartners(data.partners || []);
      setFilteredPartners(data.partners || []);
    } catch (e) {
      console.error('Error fetching partners:', e);
    }
  };

  // Search partners
  const handleSearch = async (query: string): Promise<void> => {
    setSearchQuery(query);
    if (!query) {
      setFilteredPartners(partners);
      return;
    }
    try {
      const res = await fetch(`/api/partners/search?service=${encodeURIComponent(query)}`);
      const data = await res.json();
      setFilteredPartners(data.partners || []);
      setCurrentView('search');
    } catch (e) {
      console.error('Search error:', e);
    }
  };

  // Filter by category
  const filterByCategory = (categoryId: string): void => {
    setSearchQuery(categoryId);
    const filtered = partners.filter(p => 
      p.services?.some(s => s.toLowerCase().includes(categoryId.toLowerCase()))
    );
    setFilteredPartners(filtered);
    setCurrentView('search');
  };

  // Customer Login
  const handleCustomerLogin = async (): Promise<void> => {
    try {
      const res = await fetch('/api/auth/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('carche_token', data.token);
        localStorage.setItem('carche_user', JSON.stringify(data.user));
        setUser(data.user);
        setShowLoginDialog(false);
        toast.success('Welcome back!');
        setLoginForm({ email: '', password: '' });
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch (e) {
      toast.error('Login failed');
    }
  };

  // Partner Login
  const handlePartnerLogin = async (): Promise<void> => {
    try {
      const res = await fetch('/api/auth/partner/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('carche_token', data.token);
        localStorage.setItem('carche_user', JSON.stringify(data.user));
        setUser(data.user);
        setShowLoginDialog(false);
        setCurrentView('dashboard');
        toast.success('Welcome back!');
        setLoginForm({ email: '', password: '' });
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch (e) {
      toast.error('Login failed');
    }
  };

  // Customer Register
  const handleCustomerRegister = async (): Promise<void> => {
    try {
      const res = await fetch('/api/auth/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerForm.name,
          phone: registerForm.phone,
          email: registerForm.email,
          password: registerForm.password,
          location: registerForm.location || location,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('carche_token', data.token);
        localStorage.setItem('carche_user', JSON.stringify(data.user));
        setUser(data.user);
        setShowLoginDialog(false);
        toast.success('Registration successful!');
        setRegisterForm({ name: '', phone: '', email: '', password: '', location: '', services: [], experience: '', address: '', availability: 'Full Time', pricing: '500' });
      } else {
        toast.error(data.error || 'Registration failed');
      }
    } catch (e) {
      toast.error('Registration failed');
    }
  };

  // Partner Register
  const handlePartnerRegister = async (): Promise<void> => {
    if (registerForm.services.length === 0) {
      toast.error('Please select at least one service');
      return;
    }
    try {
      const res = await fetch('/api/auth/partner/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('carche_token', data.token);
        localStorage.setItem('carche_user', JSON.stringify(data.user));
        setUser(data.user);
        setShowLoginDialog(false);
        setCurrentView('dashboard');
        toast.success('Registration successful!');
        setRegisterForm({ name: '', phone: '', email: '', password: '', location: '', services: [], experience: '', address: '', availability: 'Full Time', pricing: '500' });
      } else {
        toast.error(data.error || 'Registration failed');
      }
    } catch (e) {
      toast.error('Registration failed');
    }
  };

  // Toggle service selection
  const toggleService = (serviceName: string): void => {
    setRegisterForm(prev => ({
      ...prev,
      services: prev.services.includes(serviceName)
        ? prev.services.filter(s => s !== serviceName)
        : [...prev.services, serviceName]
    }));
  };

  // Logout
  const handleLogout = (): void => {
    localStorage.removeItem('carche_token');
    localStorage.removeItem('carche_user');
    setUser(null);
    setCurrentView('home');
    toast.success('Logged out successfully');
  };

  // Create Booking
  const handleCreateBooking = async (): Promise<void> => {
    if (!user) {
      toast.error('Please login to book');
      setShowLoginDialog(true);
      return;
    }
    try {
      const token = localStorage.getItem('carche_token');
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          partnerId: selectedPartner?.id,
          service: selectedPartner?.services?.[0] || 'General',
          ...bookingForm
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Booking request sent!');
        setShowBookingDialog(false);
        setBookingForm({ scheduledDate: '', scheduledTime: '10:00 AM', address: '', notes: '' });
        fetchBookings();
      } else {
        toast.error(data.error || 'Booking failed');
      }
    } catch (e) {
      toast.error('Booking failed');
    }
  };

  // Fetch Bookings
  const fetchBookings = async (): Promise<void> => {
    const token = localStorage.getItem('carche_token');
    if (!token || !user) return;
    
    try {
      const endpoint = user.role === 'customer' ? '/api/bookings/customer' : '/api/bookings/partner';
      const res = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (e) {
      console.error('Error fetching bookings:', e);
    }
  };

  // Fetch Dashboard
  const fetchDashboard = async (): Promise<void> => {
    const token = localStorage.getItem('carche_token');
    if (!token) return;
    
    try {
      const res = await fetch('/api/partner/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setDashboardStats(data.stats);
      setBookings(data.recentBookings || []);
    } catch (e) {
      console.error('Error fetching dashboard:', e);
    }
  };

  // Update Booking Status
  const updateBookingStatus = async (bookingId: string, status: string): Promise<void> => {
    const token = localStorage.getItem('carche_token');
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`Booking ${status}`);
        fetchDashboard();
      }
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  // Effect for view changes
  useEffect(() => {
    if (currentView === 'bookings' && user) {
      fetchBookings();
    }
    if (currentView === 'dashboard' && user?.role === 'partner') {
      fetchDashboard();
    }
  }, [currentView, user]);

  // ============ RENDER COMPONENTS ============

  // Header Component
  const Header: FC = () => (
    <header className="header">
      <div className="header__container">
        <div className="header__content">
          {/* Logo */}
          <div 
            className="header__logo" 
            onClick={() => setCurrentView('home')}
          >
            <div className="header__logo-icon">
              <Home className="w-6 h-6" />
            </div>
            <span className="header__logo-text">Carche</span>
          </div>

          {/* Location - Desktop */}
          <div className="header__location">
            <MapPin className="w-4 h-4 header__location-icon" />
            <span className="header__location-text">{location || 'Detecting location...'}</span>
          </div>

          {/* Search - Desktop */}
          <div className="header__search">
            <div className="header__search-wrapper">
              <Search className="w-5 h-5 header__search-icon" />
              <Input
                placeholder="Search for Cook, Maid, Nanny, Nurse..."
                className="header__search-input pl-10"
                value={searchQuery}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch(searchQuery)}
              />
            </div>
          </div>

          {/* Nav - Desktop */}
          <div className="header__nav">
            {user ? (
              <>
                {user.role === 'customer' && (
                  <Button variant="ghost" onClick={() => setCurrentView('bookings')}>
                    My Bookings
                  </Button>
                )}
                {user.role === 'partner' && (
                  <Button variant="ghost" onClick={() => setCurrentView('dashboard')}>
                    Dashboard
                  </Button>
                )}
                <div className="header__user">
                  <User className="w-4 h-4" />
                  <span>{user.name}</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-1" /> Logout
                </Button>
              </>
            ) : (
              <Button onClick={() => setShowLoginDialog(true)}>
                <LogIn className="w-4 h-4 mr-2" /> Login
              </Button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="header__mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile Search */}
        <div className="header__mobile-search md:hidden mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search services..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch(searchQuery)}
            />
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="header__mobile-menu">
            <div className="flex items-center gap-2 text-sm text-gray-600 px-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>{location || 'Detecting...'}</span>
            </div>
            {user ? (
              <>
                <div className="flex items-center gap-2 px-2 py-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{user.name}</span>
                  <Badge variant="secondary">{user.role}</Badge>
                </div>
                {user.role === 'customer' && (
                  <Button variant="ghost" className="w-full justify-start" onClick={() => { setCurrentView('bookings'); setMobileMenuOpen(false); }}>
                    My Bookings
                  </Button>
                )}
                {user.role === 'partner' && (
                  <Button variant="ghost" className="w-full justify-start" onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }}>
                    Dashboard
                  </Button>
                )}
                <Button variant="outline" className="w-full mt-2" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </Button>
              </>
            ) : (
              <Button className="w-full mt-2" onClick={() => { setShowLoginDialog(true); setMobileMenuOpen(false); }}>
                <LogIn className="w-4 h-4 mr-2" /> Login / Register
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );

  // Hero Section
  const HeroSection: FC = () => (
    <section className="hero">
      <div className="hero__background" />
      <div className="hero__container">
        <div className="hero__content">
          <h1 className="hero__title">
            Your Trusted Partner for
            <span className="hero__title-highlight">Home Services</span>
          </h1>
          <p className="hero__description">
            Connect with verified professionals - Cooks, Maids, Nannies, Nurses & more. Quality service at your doorstep.
          </p>
          
          {/* Search Box */}
          <div className="hero__search-box">
            <div className="hero__search-form">
              <div className="hero__search-input-wrapper">
                <Search className="w-5 h-5 hero__search-icon" />
                <input
                  type="text"
                  placeholder="What service do you need?"
                  className="hero__search-input"
                  value={searchQuery}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch(searchQuery)}
                />
              </div>
              <button 
                className="hero__search-button"
                onClick={() => handleSearch(searchQuery)}
              >
                <Search className="w-5 h-5" /> Search
              </button>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="hero__trust-indicators">
            <div className="hero__trust-item">
              <Shield className="w-5 h-5 hero__trust-item-icon--verified" />
              <span>Verified Partners</span>
            </div>
            <div className="hero__trust-item">
              <Star className="w-5 h-5 hero__trust-item-icon--rating" />
              <span>4.8+ Rating</span>
            </div>
            <div className="hero__trust-item">
              <Users className="w-5 h-5 hero__trust-item-icon--customers" />
              <span>10,000+ Happy Customers</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // Service Categories
  const ServiceCategories: FC = () => (
    <section className="services">
      <div className="services__container">
        <div className="services__header">
          <h2 className="services__title">Our Services</h2>
          <p className="services__description">Find the perfect help for all your home needs</p>
        </div>
        
        <div className="services__grid">
          {SERVICE_CATEGORIES.map((service) => {
            const Icon = service.icon;
            return (
              <Card 
                key={service.id}
                className="services__card"
                onClick={() => filterByCategory(service.id)}
              >
                <CardContent className="services__card-content">
                  <div className={`services__icon-wrapper services__icon-wrapper--${service.id}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="services__card-title">{service.name}</h3>
                  <p className="services__card-description">{service.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );

  // Partner Card
  interface PartnerCardProps {
    partner: Partner;
  }

  const PartnerCard: FC<PartnerCardProps> = ({ partner }) => (
    <Card className="partner-card">
      <CardContent className="p-0">
        <div className="partner-card__image-wrapper">
          {partner.photo ? (
            <img src={partner.photo} alt={partner.name} className="partner-card__image" />
          ) : (
            <User className="partner-card__placeholder-icon" />
          )}
          {partner.verified && (
            <div className="partner-card__verified-badge">
              <Shield className="w-3 h-3" /> Verified
            </div>
          )}
        </div>
        <div className="partner-card__content">
          <h3 className="partner-card__name">{partner.name}</h3>
          <div className="partner-card__services">
            {partner.services?.slice(0, 2).map((s, i) => (
              <span key={i} className="partner-card__service-badge">{s}</span>
            ))}
          </div>
          <div className="partner-card__details">
            <div className="partner-card__detail-item partner-card__detail-item--rating">
              <Star className="partner-card__detail-icon" />
              <span>{partner.rating || 4.5} ({partner.reviewCount || 0} reviews)</span>
            </div>
            <div className="partner-card__detail-item">
              <Briefcase className="partner-card__detail-icon" />
              <span>{partner.experience || '0'} years exp</span>
            </div>
            <div className="partner-card__detail-item">
              <MapPin className="partner-card__detail-icon" />
              <span className="truncate">{partner.address || 'Location N/A'}</span>
            </div>
            <div className="partner-card__detail-item partner-card__detail-item--price">
              <DollarSign className="partner-card__detail-icon" />
              <span>₹{partner.pricing || '500'}/day</span>
            </div>
          </div>
          <button 
            className="partner-card__book-button"
            onClick={() => {
              setSelectedPartner(partner);
              setShowBookingDialog(true);
            }}
          >
            Book Now <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );

  // Search Results
  const SearchResults: FC = () => (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Service Providers</h2>
            <p className="text-gray-600">
              {filteredPartners.length} providers found {searchQuery && `for "${searchQuery}"`}
            </p>
          </div>
          <Button variant="outline" onClick={() => { setCurrentView('home'); setSearchQuery(''); setFilteredPartners(partners); }}>
            Clear Search
          </Button>
        </div>
        
        {filteredPartners.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPartners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">No providers found</h3>
            <p className="text-gray-500 mt-2">Try searching with different keywords</p>
            <Button className="mt-4" onClick={() => setShowLoginDialog(true)}>
              Become a Partner
            </Button>
          </div>
        )}
      </div>
    </section>
  );

  // Featured Partners (Homepage)
  const FeaturedPartners: FC = () => (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Featured Service Providers</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Top-rated professionals ready to help</p>
        </div>
        
        {partners.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {partners.slice(0, 4).map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No service providers yet. Be the first to join!</p>
            <Button className="mt-4" onClick={() => setShowLoginDialog(true)}>
              Register as Partner
            </Button>
          </div>
        )}
      </div>
    </section>
  );

  // Customer Bookings View
  const CustomerBookings: FC = () => (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">My Bookings</h2>
        
        {bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">{booking.partnerName}</h3>
                      <p className="text-gray-600">{booking.service}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {booking.scheduledDate} at {booking.scheduledTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ₹{booking.amount}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={{
                        pending: 'bg-yellow-100 text-yellow-800',
                        accepted: 'bg-green-100 text-green-800',
                        rejected: 'bg-red-100 text-red-800',
                        completed: 'bg-blue-100 text-blue-800',
                      }[booking.status] || 'bg-gray-100'}>
                        {booking.status?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">No bookings yet</h3>
            <p className="text-gray-500 mt-2">Book a service provider to get started</p>
            <Button className="mt-4" onClick={() => setCurrentView('home')}>
              Find Services
            </Button>
          </div>
        )}
      </div>
    </section>
  );

  // Partner Dashboard
  const PartnerDashboard: FC = () => (
    <section className="dashboard">
      <div className="dashboard__container">
        <h2 className="dashboard__title">Partner Dashboard</h2>
        
        {/* Stats Cards */}
        {dashboardStats && (
          <div className="dashboard__stats">
            <div className="dashboard__stat-card">
              <p className="dashboard__stat-label">Total Bookings</p>
              <p className="dashboard__stat-value dashboard__stat-value--default">{dashboardStats.totalBookings}</p>
            </div>
            <div className="dashboard__stat-card">
              <p className="dashboard__stat-label">Pending Requests</p>
              <p className="dashboard__stat-value dashboard__stat-value--pending">{dashboardStats.pendingRequests}</p>
            </div>
            <div className="dashboard__stat-card">
              <p className="dashboard__stat-label">Total Earnings</p>
              <p className="dashboard__stat-value dashboard__stat-value--earnings">₹{dashboardStats.totalEarnings}</p>
            </div>
            <div className="dashboard__stat-card">
              <p className="dashboard__stat-label">Rating</p>
              <p className="dashboard__stat-value dashboard__stat-value--rating">
                {dashboardStats.rating} <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              </p>
            </div>
          </div>
        )}

        {/* Service Requests */}
        <Card className="dashboard__requests-card">
          <CardHeader className="dashboard__requests-header">
            <CardTitle className="dashboard__requests-title">Service Requests</CardTitle>
            <CardDescription className="dashboard__requests-description">Manage your booking requests</CardDescription>
          </CardHeader>
          <CardContent className="dashboard__requests-content">
            {bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="dashboard__request-item">
                    <div className="dashboard__request-header">
                      <div>
                        <h4 className="dashboard__request-customer">{booking.customerName}</h4>
                        <p className="dashboard__request-service">{booking.service}</p>
                        <div className="dashboard__request-details">
                          <span className="dashboard__request-detail">
                            <Calendar className="w-4 h-4" />
                            {booking.scheduledDate} at {booking.scheduledTime}
                          </span>
                          <span className="dashboard__request-detail">
                            <MapPin className="w-4 h-4" />
                            {booking.address || 'No address'}
                          </span>
                        </div>
                        <p className="dashboard__request-amount">₹{booking.partnerAmount} (after commission)</p>
                      </div>
                      <div className="dashboard__request-actions">
                        {booking.status === 'pending' ? (
                          <>
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => updateBookingStatus(booking.id, 'accepted')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" /> Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => updateBookingStatus(booking.id, 'rejected')}
                            >
                              <XCircle className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          </>
                        ) : booking.status === 'accepted' ? (
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => updateBookingStatus(booking.id, 'completed')}
                          >
                            Mark Complete
                          </Button>
                        ) : (
                          <Badge className={{
                            completed: 'bg-blue-100 text-blue-800',
                            rejected: 'bg-red-100 text-red-800',
                          }[booking.status] || 'bg-gray-100'}>
                            {booking.status?.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard__empty-state">
                <Calendar className="w-12 h-12 mx-auto mb-4" />
                <p>No service requests yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );

  // Footer
  const Footer: FC = () => (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__grid">
          <div className="footer__brand">
            <div className="footer__brand-logo">
              <div className="footer__brand-icon">
                <Home className="w-6 h-6 text-white" />
              </div>
              <span className="footer__brand-name">Carche</span>
            </div>
            <p className="footer__brand-description">Your trusted partner for all home services. Quality professionals at your doorstep.</p>
          </div>
          <div className="footer__section">
            <h4 className="footer__section-title">Services</h4>
            <ul className="footer__section-list">
              {SERVICE_CATEGORIES.slice(0, 4).map(s => (
                <li key={s.id} className="footer__section-item">{s.name}</li>
              ))}
            </ul>
          </div>
          <div className="footer__section">
            <h4 className="footer__section-title">Company</h4>
            <ul className="footer__section-list">
              <li className="footer__section-item">About Us</li>
              <li className="footer__section-item">Contact</li>
              <li className="footer__section-item">Careers</li>
              <li className="footer__section-item">Blog</li>
            </ul>
          </div>
          <div className="footer__section">
            <h4 className="footer__section-title">Contact Us</h4>
            <ul className="footer__section-list">
              <li className="footer__section-item footer__section-link"><Phone className="w-4 h-4" /> +91 9876543210</li>
              <li className="footer__section-item footer__section-link"><Mail className="w-4 h-4" /> support@carche.com</li>
              <li className="footer__section-item footer__section-link"><MapPin className="w-4 h-4" /> India</li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          © 2025 Carche. All rights reserved.
        </div>
      </div>
    </footer>
  );

  // Main Render
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {currentView === 'home' && (
        <>
          <HeroSection />
          <ServiceCategories />
          <FeaturedPartners />
        </>
      )}
      
      {currentView === 'search' && <SearchResults />}
      {currentView === 'bookings' && user?.role === 'customer' && <CustomerBookings />}
      {currentView === 'dashboard' && user?.role === 'partner' && <PartnerDashboard />}
      
      <Footer />
      
      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="login-dialog__content">
          <DialogHeader>
            <DialogTitle className="login-dialog__title">Welcome to Carche</DialogTitle>
            <DialogDescription className="login-dialog__description">Login or register to continue</DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="customer-login" className="login-dialog__tabs">
            <TabsList className="login-dialog__tab-list">
              <TabsTrigger value="customer-login">Customer</TabsTrigger>
              <TabsTrigger value="partner-login">Partner</TabsTrigger>
            </TabsList>
            
            {/* Customer Login */}
            <TabsContent value="customer-login">
              <Tabs defaultValue="login">
                <TabsList className="login-dialog__tab-list">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="login-dialog__form">
                  <div className="login-dialog__field">
                    <Label className="login-dialog__label">Email</Label>
                    <Input 
                      type="email" 
                      placeholder="your@email.com"
                      className="login-dialog__input"
                      value={loginForm.email}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="login-dialog__field">
                    <Label className="login-dialog__label">Password</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••"
                      className="login-dialog__input"
                      value={loginForm.password}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                  <button className="login-dialog__button login-dialog__button--customer" onClick={handleCustomerLogin}>
                    <LogIn className="w-4 h-4" /> Login as Customer
                  </button>
                </TabsContent>
                
                <TabsContent value="register" className="login-dialog__form">
                  <div className="login-dialog__field">
                    <Label className="login-dialog__label">Full Name</Label>
                    <Input 
                      placeholder="John Doe"
                      value={registerForm.name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="login-dialog__field">
                    <Label className="login-dialog__label">Phone</Label>
                    <Input 
                      placeholder="9876543210"
                      value={registerForm.phone}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="login-dialog__field">
                    <Label className="login-dialog__label">Email</Label>
                    <Input 
                      type="email" 
                      placeholder="your@email.com"
                      value={registerForm.email}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="login-dialog__field">
                    <Label className="login-dialog__label">Password</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••"
                      value={registerForm.password}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                  <button className="login-dialog__button login-dialog__button--customer" onClick={handleCustomerRegister}>
                    <User className="w-4 h-4" /> Register as Customer
                  </button>
                </TabsContent>
              </Tabs>
            </TabsContent>
            
            {/* Partner Login */}
            <TabsContent value="partner-login">
              <Tabs defaultValue="login">
                <TabsList className="login-dialog__tab-list">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="login-dialog__form">
                  <div className="login-dialog__field">
                    <Label className="login-dialog__label">Email</Label>
                    <Input 
                      type="email" 
                      placeholder="partner@email.com"
                      value={loginForm.email}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="login-dialog__field">
                    <Label className="login-dialog__label">Password</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                  <button className="login-dialog__button login-dialog__button--partner" onClick={handlePartnerLogin}>
                    <Briefcase className="w-4 h-4" /> Login as Partner
                  </button>
                </TabsContent>
                
                <TabsContent value="register" className="login-dialog__form">
                  <div className="login-dialog__field">
                    <Label className="login-dialog__label">Full Name *</Label>
                    <Input 
                      placeholder="Your Name"
                      value={registerForm.name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="login-dialog__grid">
                    <div className="login-dialog__field">
                      <Label className="login-dialog__label">Phone *</Label>
                      <Input 
                        placeholder="9876543210"
                        value={registerForm.phone}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterForm(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="login-dialog__field">
                      <Label className="login-dialog__label">Experience (years)</Label>
                      <Input 
                        placeholder="5"
                        value={registerForm.experience}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterForm(prev => ({ ...prev, experience: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="login-dialog__field">
                    <Label className="login-dialog__label">Email *</Label>
                    <Input 
                      type="email" 
                      placeholder="partner@email.com"
                      value={registerForm.email}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="login-dialog__field">
                    <Label className="login-dialog__label">Password *</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••"
                      value={registerForm.password}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                  <div className="login-dialog__field">
                    <Label className="login-dialog__label">Services Offered *</Label>
                    <div className="login-dialog__services-grid">
                      {SERVICE_CATEGORIES.map((service) => (
                        <div key={service.id} className="login-dialog__checkbox-item">
                          <Checkbox 
                            id={`service-${service.id}`}
                            checked={registerForm.services.includes(service.name)}
                            onCheckedChange={() => toggleService(service.name)}
                          />
                          <Label htmlFor={`service-${service.id}`} className="login-dialog__checkbox-label">{service.name}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="login-dialog__field">
                    <Label className="login-dialog__label">Address</Label>
                    <Input 
                      placeholder="Your working area"
                      value={registerForm.address}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterForm(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div className="login-dialog__grid">
                    <div className="login-dialog__field">
                      <Label className="login-dialog__label">Availability</Label>
                      <Select 
                        value={registerForm.availability} 
                        onValueChange={(v: string) => setRegisterForm(prev => ({ ...prev, availability: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Full Time">Full Time</SelectItem>
                          <SelectItem value="Part Time">Part Time</SelectItem>
                          <SelectItem value="Weekends">Weekends Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="login-dialog__field">
                      <Label className="login-dialog__label">Price (₹/day)</Label>
                      <Input 
                        placeholder="500"
                        value={registerForm.pricing}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterForm(prev => ({ ...prev, pricing: e.target.value }))}
                      />
                    </div>
                  </div>
                  <button className="login-dialog__button login-dialog__button--partner" onClick={handlePartnerRegister}>
                    <Briefcase className="w-4 h-4" /> Register as Partner
                  </button>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="booking-dialog__content">
          <DialogHeader>
            <DialogTitle>Book Service</DialogTitle>
            <DialogDescription>
              Book {selectedPartner?.name} for {selectedPartner?.services?.[0] || 'service'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="booking-dialog__form">
            <div className="booking-dialog__partner-info">
              <div className="booking-dialog__partner-header">
                <div className="booking-dialog__partner-avatar">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="booking-dialog__partner-name">{selectedPartner?.name}</h4>
                  <p className="booking-dialog__partner-services">{selectedPartner?.services?.join(', ')}</p>
                </div>
              </div>
              <div className="booking-dialog__partner-price">
                <span className="booking-dialog__partner-price-label">Service Fee</span>
                <span className="booking-dialog__partner-price-value">₹{selectedPartner?.pricing || 500}/day</span>
              </div>
            </div>
            
            <div className="login-dialog__field">
              <Label className="login-dialog__label">Scheduled Date *</Label>
              <Input 
                type="date" 
                value={bookingForm.scheduledDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setBookingForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
              />
            </div>
            <div className="login-dialog__field">
              <Label className="login-dialog__label">Preferred Time</Label>
              <Select 
                value={bookingForm.scheduledTime} 
                onValueChange={(v: string) => setBookingForm(prev => ({ ...prev, scheduledTime: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8:00 AM">8:00 AM</SelectItem>
                  <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                  <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                  <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                  <SelectItem value="4:00 PM">4:00 PM</SelectItem>
                  <SelectItem value="6:00 PM">6:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="login-dialog__field">
              <Label className="login-dialog__label">Your Address</Label>
              <Input 
                placeholder="Enter your address"
                value={bookingForm.address}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setBookingForm(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div className="login-dialog__field">
              <Label className="login-dialog__label">Special Instructions</Label>
              <Input 
                placeholder="Any special requirements?"
                value={bookingForm.notes}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            
            <button className="booking-dialog__button" onClick={handleCreateBooking}>
              <Calendar className="w-4 h-4" /> Confirm Booking
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default App;
