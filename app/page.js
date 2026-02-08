'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Search, MapPin, Star, Clock, ChefHat, Sparkles, Baby, Heart, 
  Users, GraduationCap, Home, LogIn, User, Shield, Phone, Mail, 
  Calendar, DollarSign, CheckCircle, XCircle, Menu, X, Briefcase,
  ArrowRight, LogOut, Settings
} from 'lucide-react';

const SERVICE_CATEGORIES = [
  { id: 'cook', name: 'Cook', icon: ChefHat, color: 'bg-orange-100 text-orange-600', description: 'Professional cooks' },
  { id: 'maid', name: 'Maid', icon: Sparkles, color: 'bg-blue-100 text-blue-600', description: 'Cleaning services' },
  { id: 'nanny', name: 'Nanny', icon: Baby, color: 'bg-pink-100 text-pink-600', description: 'Childcare experts' },
  { id: 'nurse', name: 'Nurse', icon: Heart, color: 'bg-red-100 text-red-600', description: 'Medical care' },
  { id: 'oldagecare', name: 'Old Age Care', icon: Users, color: 'bg-purple-100 text-purple-600', description: 'Elderly assistance' },
  { id: 'hometutor', name: 'Home Tutor', icon: GraduationCap, color: 'bg-green-100 text-green-600', description: 'Private tutoring' },
  { id: 'househelp', name: 'House Help', icon: Home, color: 'bg-teal-100 text-teal-600', description: 'General assistance' },
];

export default function App() {
  // State
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [partners, setPartners] = useState([]);
  const [filteredPartners, setFilteredPartners] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locationPermissionAsked, setLocationPermissionAsked] = useState(false);

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '', phone: '', email: '', password: '', location: '',
    services: [], experience: '', address: '', availability: 'Full Time', pricing: '500'
  });
  const [bookingForm, setBookingForm] = useState({
    scheduledDate: '', scheduledTime: '10:00 AM', address: '', notes: ''
  });

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
  }, [locationPermissionAsked]);

  // Request location
  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // For MVP, just show coordinates as location
          setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
          toast.success('Location detected!');
        },
        (error) => {
          console.log('Location error:', error);
          setLocation('Location not available');
        }
      );
    }
  };

  // Fetch partners
  const fetchPartners = async () => {
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
  const handleSearch = async (query) => {
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
  const filterByCategory = (categoryId) => {
    setSearchQuery(categoryId);
    const filtered = partners.filter(p => 
      p.services?.some(s => s.toLowerCase().includes(categoryId.toLowerCase()))
    );
    setFilteredPartners(filtered);
    setCurrentView('search');
  };

  // Customer Login
  const handleCustomerLogin = async () => {
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
  const handlePartnerLogin = async () => {
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
  const handleCustomerRegister = async () => {
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
  const handlePartnerRegister = async () => {
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
  const toggleService = (serviceId) => {
    setRegisterForm(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('carche_token');
    localStorage.removeItem('carche_user');
    setUser(null);
    setCurrentView('home');
    toast.success('Logged out successfully');
  };

  // Create Booking
  const handleCreateBooking = async () => {
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
          partnerId: selectedPartner.id,
          service: selectedPartner.services?.[0] || 'General',
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
  const fetchBookings = async () => {
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
  const fetchDashboard = async () => {
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
  const updateBookingStatus = async (bookingId, status) => {
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
  const Header = () => (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => setCurrentView('home')}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Carche
            </span>
          </div>

          {/* Location - Desktop */}
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="max-w-[200px] truncate">{location || 'Detecting location...'}</span>
          </div>

          {/* Search - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search for Cook, Maid, Nanny, Nurse..."
                className="pl-10 pr-4 py-2 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
              />
            </div>
          </div>

          {/* Nav - Desktop */}
          <div className="hidden md:flex items-center gap-3">
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
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">{user.name}</span>
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
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search services..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
            />
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 py-3 border-t space-y-2">
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
                <Button variant="outline" className="w-full" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </Button>
              </>
            ) : (
              <Button className="w-full" onClick={() => { setShowLoginDialog(true); setMobileMenuOpen(false); }}>
                <LogIn className="w-4 h-4 mr-2" /> Login / Register
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );

  // Hero Section
  const HeroSection = () => (
    <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556910638-6cdac31d44dc?w=1920')] bg-cover bg-center opacity-10" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Your Trusted Partner for
            <span className="block text-blue-200">Home Services</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Connect with verified professionals - Cooks, Maids, Nannies, Nurses & more. Quality service at your doorstep.
          </p>
          
          {/* Search Box */}
          <div className="bg-white rounded-2xl p-2 shadow-2xl max-w-2xl mx-auto">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="What service do you need?"
                  className="pl-12 h-12 text-gray-800 border-0 bg-gray-50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                />
              </div>
              <Button 
                size="lg" 
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700"
                onClick={() => handleSearch(searchQuery)}
              >
                <Search className="w-5 h-5 mr-2" /> Search
              </Button>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 mt-10">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-sm">Verified Partners</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-sm">4.8+ Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-300" />
              <span className="text-sm">10,000+ Happy Customers</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // Service Categories
  const ServiceCategories = () => (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Find the perfect help for all your home needs</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {SERVICE_CATEGORIES.map((service) => {
            const Icon = service.icon;
            return (
              <Card 
                key={service.id}
                className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-0 bg-white"
                onClick={() => filterByCategory(service.id)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-14 h-14 ${service.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{service.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );

  // Partner Card
  const PartnerCard = ({ partner }) => (
    <Card className="overflow-hidden hover:shadow-xl transition-all border-0 bg-white">
      <CardContent className="p-0">
        <div className="relative">
          <div className="h-32 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            {partner.photo ? (
              <img src={partner.photo} alt={partner.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-16 h-16 text-blue-400" />
            )}
          </div>
          {partner.verified && (
            <Badge className="absolute top-2 right-2 bg-green-500">
              <Shield className="w-3 h-3 mr-1" /> Verified
            </Badge>
          )}
        </div>
        <div className="p-5">
          <h3 className="text-lg font-semibold text-gray-900">{partner.name}</h3>
          <div className="flex flex-wrap gap-1 my-2">
            {partner.services?.slice(0, 2).map((s, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
            ))}
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span>{partner.rating || 4.5} ({partner.reviewCount || 0} reviews)</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-gray-400" />
              <span>{partner.experience || '0'} years exp</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="truncate">{partner.address || 'Location N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="font-semibold text-green-600">₹{partner.pricing || '500'}/day</span>
            </div>
          </div>
          <Button 
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              setSelectedPartner(partner);
              setShowBookingDialog(true);
            }}
          >
            Book Now <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Search Results
  const SearchResults = () => (
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
  const FeaturedPartners = () => (
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
  const CustomerBookings = () => (
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
  const PartnerDashboard = () => (
    <section className="py-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Partner Dashboard</h2>
        
        {/* Stats Cards */}
        {dashboardStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <p className="text-sm text-gray-500">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalBookings}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <p className="text-sm text-gray-500">Pending Requests</p>
                <p className="text-3xl font-bold text-yellow-600">{dashboardStats.pendingRequests}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <p className="text-sm text-gray-500">Total Earnings</p>
                <p className="text-3xl font-bold text-green-600">₹{dashboardStats.totalEarnings}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <p className="text-sm text-gray-500">Rating</p>
                <p className="text-3xl font-bold text-blue-600 flex items-center gap-1">
                  {dashboardStats.rating} <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Service Requests */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Service Requests</CardTitle>
            <CardDescription>Manage your booking requests</CardDescription>
          </CardHeader>
          <CardContent>
            {bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-semibold">{booking.customerName}</h4>
                        <p className="text-sm text-gray-600">{booking.service}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {booking.scheduledDate} at {booking.scheduledTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {booking.address || 'No address'}
                          </span>
                        </div>
                        <p className="text-sm text-green-600 font-semibold mt-1">₹{booking.partnerAmount} (after commission)</p>
                      </div>
                      <div className="flex items-center gap-2">
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
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No service requests yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );

  // Login Dialog
  const LoginDialog = () => (
    <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to Carche</DialogTitle>
          <DialogDescription>Login or register to continue</DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="customer-login" className="mt-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="customer-login">Customer</TabsTrigger>
            <TabsTrigger value="partner-login">Partner</TabsTrigger>
          </TabsList>
          
          {/* Customer Login */}
          <TabsContent value="customer-login" className="space-y-4 mt-4">
            <Tabs defaultValue="login">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email" 
                    placeholder="your@email.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input 
                    type="password" 
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
                </div>
                <Button className="w-full" onClick={handleCustomerLogin}>
                  <LogIn className="w-4 h-4 mr-2" /> Login as Customer
                </Button>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    placeholder="John Doe"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input 
                    placeholder="9876543210"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email" 
                    placeholder="your@email.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input 
                    type="password" 
                    placeholder="••••••••"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  />
                </div>
                <Button className="w-full" onClick={handleCustomerRegister}>
                  <User className="w-4 h-4 mr-2" /> Register as Customer
                </Button>
              </TabsContent>
            </Tabs>
          </TabsContent>
          
          {/* Partner Login */}
          <TabsContent value="partner-login" className="space-y-4 mt-4">
            <Tabs defaultValue="login">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email" 
                    placeholder="partner@email.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input 
                    type="password" 
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handlePartnerLogin}>
                  <Briefcase className="w-4 h-4 mr-2" /> Login as Partner
                </Button>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input 
                    placeholder="Your Name"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input 
                      placeholder="9876543210"
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Experience (years)</Label>
                    <Input 
                      placeholder="5"
                      value={registerForm.experience}
                      onChange={(e) => setRegisterForm({ ...registerForm, experience: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input 
                    type="email" 
                    placeholder="partner@email.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input 
                    type="password" 
                    placeholder="••••••••"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Services Offered *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {SERVICE_CATEGORIES.map((service) => (
                      <div key={service.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={service.id}
                          checked={registerForm.services.includes(service.name)}
                          onCheckedChange={() => toggleService(service.name)}
                        />
                        <Label htmlFor={service.id} className="text-sm cursor-pointer">{service.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input 
                    placeholder="Your working area"
                    value={registerForm.address}
                    onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Availability</Label>
                    <Select 
                      value={registerForm.availability} 
                      onValueChange={(v) => setRegisterForm({ ...registerForm, availability: v })}
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
                  <div className="space-y-2">
                    <Label>Price (₹/day)</Label>
                    <Input 
                      placeholder="500"
                      value={registerForm.pricing}
                      onChange={(e) => setRegisterForm({ ...registerForm, pricing: e.target.value })}
                    />
                  </div>
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handlePartnerRegister}>
                  <Briefcase className="w-4 h-4 mr-2" /> Register as Partner
                </Button>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );

  // Booking Dialog
  const BookingDialog = () => (
    <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book Service</DialogTitle>
          <DialogDescription>
            Book {selectedPartner?.name} for {selectedPartner?.services?.[0] || 'service'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold">{selectedPartner?.name}</h4>
                <p className="text-sm text-gray-500">{selectedPartner?.services?.join(', ')}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t flex justify-between text-sm">
              <span className="text-gray-500">Service Fee</span>
              <span className="font-semibold text-green-600">₹{selectedPartner?.pricing || 500}/day</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Scheduled Date *</Label>
            <Input 
              type="date" 
              value={bookingForm.scheduledDate}
              onChange={(e) => setBookingForm({ ...bookingForm, scheduledDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Preferred Time</Label>
            <Select 
              value={bookingForm.scheduledTime} 
              onValueChange={(v) => setBookingForm({ ...bookingForm, scheduledTime: v })}
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
          <div className="space-y-2">
            <Label>Your Address</Label>
            <Input 
              placeholder="Enter your address"
              value={bookingForm.address}
              onChange={(e) => setBookingForm({ ...bookingForm, address: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Special Instructions</Label>
            <Input 
              placeholder="Any special requirements?"
              value={bookingForm.notes}
              onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
            />
          </div>
          
          <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleCreateBooking}>
            <Calendar className="w-4 h-4 mr-2" /> Confirm Booking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Footer
  const Footer = () => (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Home className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold">Carche</span>
            </div>
            <p className="text-gray-400 text-sm">Your trusted partner for all home services. Quality professionals at your doorstep.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {SERVICE_CATEGORIES.slice(0, 4).map(s => (
                <li key={s.id} className="hover:text-white cursor-pointer">{s.name}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="hover:text-white cursor-pointer">About Us</li>
              <li className="hover:text-white cursor-pointer">Contact</li>
              <li className="hover:text-white cursor-pointer">Careers</li>
              <li className="hover:text-white cursor-pointer">Blog</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +91 9876543210</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> support@carche.com</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> India</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
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
      <LoginDialog />
      <BookingDialog />
    </div>
  );
}
