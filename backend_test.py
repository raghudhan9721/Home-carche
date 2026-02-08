#!/usr/bin/env python3
"""
Carche Backend API Testing Suite
Tests all backend APIs for the home services platform
"""

import requests
import json
import os
from datetime import datetime, timedelta

# Get base URL from environment
BASE_URL = "https://helperlink-6.preview.emergentagent.com/api"

class CarcheAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.customer_token = None
        self.partner_token = None
        self.customer_data = None
        self.partner_data = None
        self.partner_id = None
        self.booking_id = None
        self.test_results = {}
        
    def log_result(self, test_name, success, message="", data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        self.test_results[test_name] = {
            "success": success,
            "message": message,
            "data": data
        }
        
    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'ok':
                    self.log_result("Health Check", True, "API is healthy")
                    return True
                else:
                    self.log_result("Health Check", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_result("Health Check", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Health Check", False, f"Exception: {str(e)}")
            return False
    
    def test_customer_registration(self):
        """Test customer registration"""
        try:
            customer_data = {
                "name": "Priya Sharma",
                "phone": "9876543210",
                "email": "priya.sharma@example.com",
                "password": "securepass123",
                "location": "Delhi"
            }
            
            response = requests.post(
                f"{self.base_url}/auth/customer/register",
                json=customer_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('token') and data.get('user'):
                    self.customer_token = data['token']
                    self.customer_data = data['user']
                    self.log_result("Customer Registration", True, "Customer registered successfully")
                    return True
                else:
                    self.log_result("Customer Registration", False, f"Missing token or user data: {data}")
                    return False
            else:
                self.log_result("Customer Registration", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Customer Registration", False, f"Exception: {str(e)}")
            return False
    
    def test_customer_login(self):
        """Test customer login"""
        try:
            login_data = {
                "email": "priya.sharma@example.com",
                "password": "securepass123"
            }
            
            response = requests.post(
                f"{self.base_url}/auth/customer/login",
                json=login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('token') and data.get('user'):
                    # Update token in case it's different
                    self.customer_token = data['token']
                    self.log_result("Customer Login", True, "Customer login successful")
                    return True
                else:
                    self.log_result("Customer Login", False, f"Missing token or user data: {data}")
                    return False
            else:
                self.log_result("Customer Login", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Customer Login", False, f"Exception: {str(e)}")
            return False
    
    def test_partner_registration(self):
        """Test partner registration"""
        try:
            partner_data = {
                "name": "Rajesh Kumar",
                "phone": "9876543211",
                "email": "rajesh.cook@example.com",
                "password": "cookpass123",
                "services": ["Cook", "Kitchen Helper"],
                "experience": "5 years",
                "address": "Sector 15, Noida",
                "availability": "Full Time",
                "pricing": "800"
            }
            
            response = requests.post(
                f"{self.base_url}/auth/partner/register",
                json=partner_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('token') and data.get('user'):
                    self.partner_token = data['token']
                    self.partner_data = data['user']
                    self.partner_id = data['user']['id']
                    self.log_result("Partner Registration", True, "Partner registered successfully")
                    return True
                else:
                    self.log_result("Partner Registration", False, f"Missing token or user data: {data}")
                    return False
            else:
                self.log_result("Partner Registration", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Partner Registration", False, f"Exception: {str(e)}")
            return False
    
    def test_partner_login(self):
        """Test partner login"""
        try:
            login_data = {
                "email": "rajesh.cook@example.com",
                "password": "cookpass123"
            }
            
            response = requests.post(
                f"{self.base_url}/auth/partner/login",
                json=login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('token') and data.get('user'):
                    # Update token in case it's different
                    self.partner_token = data['token']
                    self.log_result("Partner Login", True, "Partner login successful")
                    return True
                else:
                    self.log_result("Partner Login", False, f"Missing token or user data: {data}")
                    return False
            else:
                self.log_result("Partner Login", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Partner Login", False, f"Exception: {str(e)}")
            return False
    
    def test_get_all_partners(self):
        """Test getting all partners"""
        try:
            response = requests.get(f"{self.base_url}/partners", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'partners' in data and isinstance(data['partners'], list):
                    partners_count = len(data['partners'])
                    self.log_result("Get All Partners", True, f"Retrieved {partners_count} partners")
                    return True
                else:
                    self.log_result("Get All Partners", False, f"Invalid response format: {data}")
                    return False
            else:
                self.log_result("Get All Partners", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Get All Partners", False, f"Exception: {str(e)}")
            return False
    
    def test_search_partners(self):
        """Test searching partners by service"""
        try:
            response = requests.get(f"{self.base_url}/partners/search?service=cook", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'partners' in data and isinstance(data['partners'], list):
                    partners_count = len(data['partners'])
                    self.log_result("Search Partners", True, f"Found {partners_count} cook partners")
                    return True
                else:
                    self.log_result("Search Partners", False, f"Invalid response format: {data}")
                    return False
            else:
                self.log_result("Search Partners", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Search Partners", False, f"Exception: {str(e)}")
            return False
    
    def test_get_single_partner(self):
        """Test getting single partner by ID"""
        if not self.partner_id:
            self.log_result("Get Single Partner", False, "No partner ID available")
            return False
            
        try:
            response = requests.get(f"{self.base_url}/partners/{self.partner_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'partner' in data and data['partner'].get('id') == self.partner_id:
                    self.log_result("Get Single Partner", True, "Partner details retrieved successfully")
                    return True
                else:
                    self.log_result("Get Single Partner", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_result("Get Single Partner", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Get Single Partner", False, f"Exception: {str(e)}")
            return False
    
    def test_create_booking(self):
        """Test creating a booking"""
        if not self.customer_token or not self.partner_id:
            self.log_result("Create Booking", False, "Missing customer token or partner ID")
            return False
            
        try:
            tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            booking_data = {
                "partnerId": self.partner_id,
                "service": "Cook",
                "scheduledDate": tomorrow,
                "scheduledTime": "10:00 AM",
                "address": "123 Main Street, Delhi",
                "notes": "Need cooking for lunch and dinner"
            }
            
            headers = {"Authorization": f"Bearer {self.customer_token}"}
            response = requests.post(
                f"{self.base_url}/bookings",
                json=booking_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('booking') and data['booking'].get('id'):
                    self.booking_id = data['booking']['id']
                    self.log_result("Create Booking", True, "Booking created successfully")
                    return True
                else:
                    self.log_result("Create Booking", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_result("Create Booking", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Create Booking", False, f"Exception: {str(e)}")
            return False
    
    def test_get_customer_bookings(self):
        """Test getting customer bookings"""
        if not self.customer_token:
            self.log_result("Get Customer Bookings", False, "Missing customer token")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.customer_token}"}
            response = requests.get(
                f"{self.base_url}/bookings/customer",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'bookings' in data and isinstance(data['bookings'], list):
                    bookings_count = len(data['bookings'])
                    self.log_result("Get Customer Bookings", True, f"Retrieved {bookings_count} customer bookings")
                    return True
                else:
                    self.log_result("Get Customer Bookings", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_result("Get Customer Bookings", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Get Customer Bookings", False, f"Exception: {str(e)}")
            return False
    
    def test_get_partner_bookings(self):
        """Test getting partner bookings"""
        if not self.partner_token:
            self.log_result("Get Partner Bookings", False, "Missing partner token")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.partner_token}"}
            response = requests.get(
                f"{self.base_url}/bookings/partner",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'bookings' in data and isinstance(data['bookings'], list):
                    bookings_count = len(data['bookings'])
                    self.log_result("Get Partner Bookings", True, f"Retrieved {bookings_count} partner bookings")
                    return True
                else:
                    self.log_result("Get Partner Bookings", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_result("Get Partner Bookings", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Get Partner Bookings", False, f"Exception: {str(e)}")
            return False
    
    def test_update_booking_status(self):
        """Test updating booking status"""
        if not self.partner_token or not self.booking_id:
            self.log_result("Update Booking Status", False, "Missing partner token or booking ID")
            return False
            
        try:
            # Test accepting the booking
            headers = {"Authorization": f"Bearer {self.partner_token}"}
            status_data = {"status": "accepted"}
            
            response = requests.put(
                f"{self.base_url}/bookings/{self.booking_id}/status",
                json=status_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'accepted':
                    self.log_result("Update Booking Status", True, "Booking status updated to accepted")
                    return True
                else:
                    self.log_result("Update Booking Status", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_result("Update Booking Status", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Update Booking Status", False, f"Exception: {str(e)}")
            return False
    
    def test_complete_booking(self):
        """Test completing a booking"""
        if not self.partner_token or not self.booking_id:
            self.log_result("Complete Booking", False, "Missing partner token or booking ID")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.partner_token}"}
            status_data = {"status": "completed"}
            
            response = requests.put(
                f"{self.base_url}/bookings/{self.booking_id}/status",
                json=status_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'completed':
                    self.log_result("Complete Booking", True, "Booking completed successfully")
                    return True
                else:
                    self.log_result("Complete Booking", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_result("Complete Booking", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Complete Booking", False, f"Exception: {str(e)}")
            return False
    
    def test_partner_dashboard(self):
        """Test partner dashboard API"""
        if not self.partner_token:
            self.log_result("Partner Dashboard", False, "Missing partner token")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.partner_token}"}
            response = requests.get(
                f"{self.base_url}/partner/dashboard",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'stats' in data and 'partner' in data:
                    stats = data['stats']
                    required_stats = ['totalBookings', 'pendingRequests', 'completedBookings', 'totalEarnings']
                    if all(stat in stats for stat in required_stats):
                        self.log_result("Partner Dashboard", True, f"Dashboard stats retrieved: {stats}")
                        return True
                    else:
                        self.log_result("Partner Dashboard", False, f"Missing required stats: {data}")
                        return False
                else:
                    self.log_result("Partner Dashboard", False, f"Invalid response format: {data}")
                    return False
            else:
                self.log_result("Partner Dashboard", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Partner Dashboard", False, f"Exception: {str(e)}")
            return False
    
    def test_services_list(self):
        """Test services list API"""
        try:
            response = requests.get(f"{self.base_url}/services", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'services' in data and isinstance(data['services'], list):
                    services_count = len(data['services'])
                    if services_count > 0:
                        self.log_result("Services List", True, f"Retrieved {services_count} service categories")
                        return True
                    else:
                        self.log_result("Services List", False, "No services found")
                        return False
                else:
                    self.log_result("Services List", False, f"Invalid response format: {data}")
                    return False
            else:
                self.log_result("Services List", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Services List", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"🚀 Starting Carche Backend API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        # Test sequence following the complete flow
        tests = [
            ("Health Check", self.test_health_check),
            ("Customer Registration", self.test_customer_registration),
            ("Customer Login", self.test_customer_login),
            ("Partner Registration", self.test_partner_registration),
            ("Partner Login", self.test_partner_login),
            ("Get All Partners", self.test_get_all_partners),
            ("Search Partners", self.test_search_partners),
            ("Get Single Partner", self.test_get_single_partner),
            ("Services List", self.test_services_list),
            ("Create Booking", self.test_create_booking),
            ("Get Customer Bookings", self.test_get_customer_bookings),
            ("Get Partner Bookings", self.test_get_partner_bookings),
            ("Update Booking Status", self.test_update_booking_status),
            ("Complete Booking", self.test_complete_booking),
            ("Partner Dashboard", self.test_partner_dashboard),
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            print(f"\n🧪 Running: {test_name}")
            try:
                success = test_func()
                if success:
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ FAIL {test_name}: Unexpected error - {str(e)}")
                failed += 1
        
        print("\n" + "=" * 60)
        print(f"📊 TEST SUMMARY")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        if failed > 0:
            print(f"\n🔍 FAILED TESTS:")
            for test_name, result in self.test_results.items():
                if not result['success']:
                    print(f"   ❌ {test_name}: {result['message']}")
        
        return passed, failed

if __name__ == "__main__":
    tester = CarcheAPITester()
    passed, failed = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    exit(0 if failed == 0 else 1)