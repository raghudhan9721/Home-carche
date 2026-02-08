import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { generateToken, verifyToken, hashPassword, comparePassword } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper to get auth user
async function getAuthUser(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

// Route handler
async function handleRequest(request, { params }) {
  const { path } = await params || { path: [] };
  const routePath = '/' + (path?.join('/') || '');
  const method = request.method;

  // Health check
  if (routePath === '/health' && method === 'GET') {
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() }, { headers: corsHeaders });
  }

  const db = await getDb();

  // ============ AUTH ROUTES ============
  
  // Customer Registration
  if (routePath === '/auth/customer/register' && method === 'POST') {
    try {
      const body = await request.json();
      const { name, phone, email, password, location } = body;
      
      if (!name || !phone || !email || !password) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400, headers: corsHeaders });
      }
      
      const existing = await db.collection('customers').findOne({ $or: [{ email }, { phone }] });
      if (existing) {
        return NextResponse.json({ error: 'Email or phone already registered' }, { status: 400, headers: corsHeaders });
      }
      
      const customer = {
        id: uuidv4(),
        name,
        phone,
        email,
        password: hashPassword(password),
        location: location || '',
        role: 'customer',
        createdAt: new Date().toISOString(),
      };
      
      await db.collection('customers').insertOne(customer);
      const token = generateToken({ id: customer.id, email, role: 'customer', name });
      
      return NextResponse.json({ 
        message: 'Registration successful', 
        token, 
        user: { id: customer.id, name, email, phone, location: customer.location, role: 'customer' } 
      }, { headers: corsHeaders });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
    }
  }
  
  // Customer Login
  if (routePath === '/auth/customer/login' && method === 'POST') {
    try {
      const body = await request.json();
      const { email, password } = body;
      
      const customer = await db.collection('customers').findOne({ email });
      if (!customer || !comparePassword(password, customer.password)) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: corsHeaders });
      }
      
      const token = generateToken({ id: customer.id, email, role: 'customer', name: customer.name });
      
      return NextResponse.json({ 
        token, 
        user: { id: customer.id, name: customer.name, email, phone: customer.phone, location: customer.location, role: 'customer' } 
      }, { headers: corsHeaders });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
    }
  }
  
  // Partner Registration
  if (routePath === '/auth/partner/register' && method === 'POST') {
    try {
      const body = await request.json();
      const { name, phone, email, password, services, experience, address, availability, pricing, photo, idProof } = body;
      
      if (!name || !phone || !email || !password || !services || services.length === 0) {
        return NextResponse.json({ error: 'Required fields missing' }, { status: 400, headers: corsHeaders });
      }
      
      const existing = await db.collection('partners').findOne({ $or: [{ email }, { phone }] });
      if (existing) {
        return NextResponse.json({ error: 'Email or phone already registered' }, { status: 400, headers: corsHeaders });
      }
      
      const partner = {
        id: uuidv4(),
        name,
        phone,
        email,
        password: hashPassword(password),
        services: services || [],
        experience: experience || '0',
        address: address || '',
        availability: availability || 'Full Time',
        pricing: pricing || '500',
        photo: photo || '',
        idProof: idProof || '',
        rating: 4.5,
        reviewCount: 0,
        verified: false,
        role: 'partner',
        totalEarnings: 0,
        pendingEarnings: 0,
        createdAt: new Date().toISOString(),
      };
      
      await db.collection('partners').insertOne(partner);
      const token = generateToken({ id: partner.id, email, role: 'partner', name });
      
      return NextResponse.json({ 
        message: 'Registration successful', 
        token, 
        user: { ...partner, password: undefined } 
      }, { headers: corsHeaders });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
    }
  }
  
  // Partner Login
  if (routePath === '/auth/partner/login' && method === 'POST') {
    try {
      const body = await request.json();
      const { email, password } = body;
      
      const partner = await db.collection('partners').findOne({ email });
      if (!partner || !comparePassword(password, partner.password)) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: corsHeaders });
      }
      
      const token = generateToken({ id: partner.id, email, role: 'partner', name: partner.name });
      
      return NextResponse.json({ 
        token, 
        user: { ...partner, password: undefined } 
      }, { headers: corsHeaders });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
    }
  }
  
  // ============ SERVICE PROVIDERS (PARTNERS) ============
  
  // Search Partners
  if (routePath === '/partners/search' && method === 'GET') {
    try {
      const url = new URL(request.url);
      const service = url.searchParams.get('service') || '';
      const location = url.searchParams.get('location') || '';
      
      let query = {};
      if (service) {
        query.services = { $regex: service, $options: 'i' };
      }
      if (location) {
        query.address = { $regex: location, $options: 'i' };
      }
      
      const partners = await db.collection('partners')
        .find(query)
        .project({ password: 0 })
        .toArray();
      
      return NextResponse.json({ partners }, { headers: corsHeaders });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
    }
  }
  
  // Get All Partners
  if (routePath === '/partners' && method === 'GET') {
    try {
      const partners = await db.collection('partners')
        .find({})
        .project({ password: 0 })
        .toArray();
      
      return NextResponse.json({ partners }, { headers: corsHeaders });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
    }
  }
  
  // Get Single Partner
  if (routePath.startsWith('/partners/') && method === 'GET' && !routePath.includes('search')) {
    try {
      const partnerId = routePath.split('/')[2];
      const partner = await db.collection('partners').findOne({ id: partnerId }, { projection: { password: 0 } });
      
      if (!partner) {
        return NextResponse.json({ error: 'Partner not found' }, { status: 404, headers: corsHeaders });
      }
      
      return NextResponse.json({ partner }, { headers: corsHeaders });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
    }
  }
  
  // Update Partner Profile
  if (routePath === '/partners/profile' && method === 'PUT') {
    try {
      const user = await getAuthUser(request);
      if (!user || user.role !== 'partner') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
      }
      
      const body = await request.json();
      const { services, experience, address, availability, pricing, photo } = body;
      
      const update = {};
      if (services) update.services = services;
      if (experience) update.experience = experience;
      if (address) update.address = address;
      if (availability) update.availability = availability;
      if (pricing) update.pricing = pricing;
      if (photo) update.photo = photo;
      
      await db.collection('partners').updateOne({ id: user.id }, { $set: update });
      const partner = await db.collection('partners').findOne({ id: user.id }, { projection: { password: 0 } });
      
      return NextResponse.json({ message: 'Profile updated', partner }, { headers: corsHeaders });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
    }
  }
  
  // ============ BOOKINGS ============
  
  // Create Booking
  if (routePath === '/bookings' && method === 'POST') {
    try {
      const user = await getAuthUser(request);
      if (!user || user.role !== 'customer') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
      }
      
      const body = await request.json();
      const { partnerId, service, scheduledDate, scheduledTime, address, notes } = body;
      
      if (!partnerId || !service || !scheduledDate) {
        return NextResponse.json({ error: 'Required fields missing' }, { status: 400, headers: corsHeaders });
      }
      
      const partner = await db.collection('partners').findOne({ id: partnerId });
      if (!partner) {
        return NextResponse.json({ error: 'Partner not found' }, { status: 404, headers: corsHeaders });
      }
      
      const booking = {
        id: uuidv4(),
        customerId: user.id,
        customerName: user.name,
        partnerId,
        partnerName: partner.name,
        service,
        scheduledDate,
        scheduledTime: scheduledTime || '10:00 AM',
        address: address || '',
        notes: notes || '',
        status: 'pending',
        amount: parseInt(partner.pricing) || 500,
        platformFee: Math.round((parseInt(partner.pricing) || 500) * 0.1),
        partnerAmount: Math.round((parseInt(partner.pricing) || 500) * 0.9),
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
      };
      
      await db.collection('bookings').insertOne(booking);
      
      return NextResponse.json({ message: 'Booking request sent', booking }, { headers: corsHeaders });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
    }
  }
  
  // Get Customer Bookings
  if (routePath === '/bookings/customer' && method === 'GET') {
    try {
      const user = await getAuthUser(request);
      if (!user || user.role !== 'customer') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
      }
      
      const bookings = await db.collection('bookings')
        .find({ customerId: user.id })
        .sort({ createdAt: -1 })
        .toArray();
      
      return NextResponse.json({ bookings }, { headers: corsHeaders });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
    }
  }
  
  // Get Partner Bookings
  if (routePath === '/bookings/partner' && method === 'GET') {
    try {
      const user = await getAuthUser(request);
      if (!user || user.role !== 'partner') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
      }
      
      const bookings = await db.collection('bookings')
        .find({ partnerId: user.id })
        .sort({ createdAt: -1 })
        .toArray();
      
      return NextResponse.json({ bookings }, { headers: corsHeaders });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
    }
  }
  
  // Update Booking Status (Partner)
  if (routePath.startsWith('/bookings/') && routePath.endsWith('/status') && method === 'PUT') {
    try {
      const user = await getAuthUser(request);
      if (!user || user.role !== 'partner') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
      }
      
      const bookingId = routePath.split('/')[2];
      const body = await request.json();
      const { status } = body;
      
      if (!['accepted', 'rejected', 'completed', 'cancelled'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400, headers: corsHeaders });
      }
      
      const booking = await db.collection('bookings').findOne({ id: bookingId, partnerId: user.id });
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404, headers: corsHeaders });
      }
      
      await db.collection('bookings').updateOne({ id: bookingId }, { $set: { status } });
      
      // If completed, update partner earnings
      if (status === 'completed') {
        await db.collection('partners').updateOne(
          { id: user.id },
          { $inc: { totalEarnings: booking.partnerAmount, pendingEarnings: booking.partnerAmount } }
        );
        await db.collection('bookings').updateOne({ id: bookingId }, { $set: { paymentStatus: 'completed' } });
      }
      
      return NextResponse.json({ message: 'Status updated', status }, { headers: corsHeaders });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
    }
  }
  
  // ============ PARTNER DASHBOARD ============
  
  // Get Partner Dashboard Stats
  if (routePath === '/partner/dashboard' && method === 'GET') {
    try {
      const user = await getAuthUser(request);
      if (!user || user.role !== 'partner') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
      }
      
      const partner = await db.collection('partners').findOne({ id: user.id }, { projection: { password: 0 } });
      const bookings = await db.collection('bookings').find({ partnerId: user.id }).toArray();
      
      const stats = {
        totalBookings: bookings.length,
        pendingRequests: bookings.filter(b => b.status === 'pending').length,
        completedBookings: bookings.filter(b => b.status === 'completed').length,
        totalEarnings: partner.totalEarnings || 0,
        pendingEarnings: partner.pendingEarnings || 0,
        rating: partner.rating || 4.5,
      };
      
      return NextResponse.json({ stats, partner, recentBookings: bookings.slice(0, 5) }, { headers: corsHeaders });
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
    }
  }
  
  // ============ SERVICE CATEGORIES ============
  
  if (routePath === '/services' && method === 'GET') {
    const services = [
      { id: 'cook', name: 'Cook', icon: 'ChefHat', description: 'Professional cooks for your home' },
      { id: 'maid', name: 'Maid', icon: 'Sparkles', description: 'Household cleaning and maintenance' },
      { id: 'nanny', name: 'Nanny', icon: 'Baby', description: 'Childcare and babysitting services' },
      { id: 'nurse', name: 'Nurse', icon: 'Heart', description: 'Medical care at home' },
      { id: 'oldagecare', name: 'Old Age Care', icon: 'Users', description: 'Elderly care and assistance' },
      { id: 'hometutor', name: 'Home Tutor', icon: 'GraduationCap', description: 'Private tutoring at home' },
      { id: 'househelp', name: 'House Help', icon: 'Home', description: 'General household assistance' },
    ];
    return NextResponse.json({ services }, { headers: corsHeaders });
  }
  
  // 404
  return NextResponse.json({ error: 'Route not found', path: routePath }, { status: 404, headers: corsHeaders });
}

export async function GET(request, context) {
  return handleRequest(request, context);
}

export async function POST(request, context) {
  return handleRequest(request, context);
}

export async function PUT(request, context) {
  return handleRequest(request, context);
}

export async function DELETE(request, context) {
  return handleRequest(request, context);
}

export async function OPTIONS(request) {
  return NextResponse.json({}, { headers: corsHeaders });
}
