#!/usr/bin/env python3
"""
Carche Backend API Edge Case Testing
Tests error handling and edge cases
"""

import requests
import json

BASE_URL = "https://helperlink-6.preview.emergentagent.com/api"

class CarcheEdgeCaseTester:
    def __init__(self):
        self.base_url = BASE_URL
        
    def log_result(self, test_name, success, message=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
    def test_invalid_routes(self):
        """Test invalid API routes"""
        try:
            response = requests.get(f"{self.base_url}/invalid-route", timeout=10)
            if response.status_code == 404:
                self.log_result("Invalid Route Handling", True, "404 returned for invalid route")
                return True
            else:
                self.log_result("Invalid Route Handling", False, f"Expected 404, got {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Invalid Route Handling", False, f"Exception: {str(e)}")
            return False
    
    def test_duplicate_registration(self):
        """Test duplicate email registration"""
        try:
            customer_data = {
                "name": "Test User",
                "phone": "9999999999",
                "email": "duplicate@test.com",
                "password": "password123",
                "location": "Test City"
            }
            
            # First registration
            response1 = requests.post(f"{self.base_url}/auth/customer/register", json=customer_data, timeout=10)
            
            # Second registration with same email
            response2 = requests.post(f"{self.base_url}/auth/customer/register", json=customer_data, timeout=10)
            
            if response1.status_code == 200 and response2.status_code == 400:
                self.log_result("Duplicate Registration Prevention", True, "Duplicate registration properly rejected")
                return True
            else:
                self.log_result("Duplicate Registration Prevention", False, f"Status codes: {response1.status_code}, {response2.status_code}")
                return False
        except Exception as e:
            self.log_result("Duplicate Registration Prevention", False, f"Exception: {str(e)}")
            return False
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        try:
            login_data = {
                "email": "nonexistent@test.com",
                "password": "wrongpassword"
            }
            
            response = requests.post(f"{self.base_url}/auth/customer/login", json=login_data, timeout=10)
            
            if response.status_code == 401:
                self.log_result("Invalid Login Handling", True, "Invalid credentials properly rejected")
                return True
            else:
                self.log_result("Invalid Login Handling", False, f"Expected 401, got {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Invalid Login Handling", False, f"Exception: {str(e)}")
            return False
    
    def test_unauthorized_booking(self):
        """Test booking without authentication"""
        try:
            booking_data = {
                "partnerId": "test-partner-id",
                "service": "Cook",
                "scheduledDate": "2025-01-20",
                "scheduledTime": "10:00 AM",
                "address": "Test Address"
            }
            
            response = requests.post(f"{self.base_url}/bookings", json=booking_data, timeout=10)
            
            if response.status_code == 401:
                self.log_result("Unauthorized Booking Prevention", True, "Unauthorized booking properly rejected")
                return True
            else:
                self.log_result("Unauthorized Booking Prevention", False, f"Expected 401, got {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Unauthorized Booking Prevention", False, f"Exception: {str(e)}")
            return False
    
    def test_invalid_partner_search(self):
        """Test partner search with non-existent service"""
        try:
            response = requests.get(f"{self.base_url}/partners/search?service=nonexistentservice", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'partners' in data and len(data['partners']) == 0:
                    self.log_result("Invalid Service Search", True, "Empty results for non-existent service")
                    return True
                else:
                    self.log_result("Invalid Service Search", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_result("Invalid Service Search", False, f"Expected 200, got {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Invalid Service Search", False, f"Exception: {str(e)}")
            return False
    
    def test_missing_required_fields(self):
        """Test registration with missing required fields"""
        try:
            incomplete_data = {
                "name": "Test User",
                # Missing phone, email, password
            }
            
            response = requests.post(f"{self.base_url}/auth/customer/register", json=incomplete_data, timeout=10)
            
            if response.status_code == 400:
                self.log_result("Missing Fields Validation", True, "Missing required fields properly rejected")
                return True
            else:
                self.log_result("Missing Fields Validation", False, f"Expected 400, got {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Missing Fields Validation", False, f"Exception: {str(e)}")
            return False
    
    def run_edge_case_tests(self):
        """Run all edge case tests"""
        print(f"🔍 Starting Carche Backend Edge Case Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        tests = [
            ("Invalid Route Handling", self.test_invalid_routes),
            ("Duplicate Registration Prevention", self.test_duplicate_registration),
            ("Invalid Login Handling", self.test_invalid_login),
            ("Unauthorized Booking Prevention", self.test_unauthorized_booking),
            ("Invalid Service Search", self.test_invalid_partner_search),
            ("Missing Fields Validation", self.test_missing_required_fields),
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
        print(f"📊 EDGE CASE TEST SUMMARY")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        return passed, failed

if __name__ == "__main__":
    tester = CarcheEdgeCaseTester()
    passed, failed = tester.run_edge_case_tests()
    
    exit(0 if failed == 0 else 1)