#!/usr/bin/env python3
"""
Test script for MetaMask authentication endpoints
"""

import requests
import json
import time

BASE_URL = 'http://localhost:5000'

def test_auth_endpoints():
    """Test the authentication endpoints"""

    print("🧪 Testing MetaMask Authentication Endpoints")
    print("=" * 50)

    # Test 1: Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print("✅ Server is running")
            print(f"   Status: {data.get('status')}")
            print(f"   Web3 Connected: {data.get('web3_connected')}")
        else:
            print(f"❌ Server health check failed: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        return

    # Test 2: Check auth endpoints exist
    try:
        response = requests.get(f"{BASE_URL}/api/auth/verify")
        print(f"✅ Auth verify endpoint accessible (expected 401): {response.status_code}")
        if response.status_code == 401:
            data = response.json()
            print(f"   Response: {data.get('error', 'No token provided')}")
    except Exception as e:
        print(f"❌ Auth verify endpoint error: {e}")

    # Test 3: Test invalid login
    try:
        payload = {
            'wallet_address': '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            'signature': '0x1234567890abcdef',
            'message': 'TrueMark Mint Authentication\n\nWallet: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e\nTimestamp: 2025-01-10T08:40:15.000Z\n\nSign this message to authenticate with TrueMark Mint.'
        }
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        print(f"✅ Auth login endpoint accessible: {response.status_code}")
        if response.status_code == 400:
            data = response.json()
            print(f"   Response: {data.get('error', 'Invalid request')}")
        elif response.status_code == 200:
            print("   ⚠️ Unexpected success with invalid signature")
    except Exception as e:
        print(f"❌ Auth login endpoint error: {e}")

    print("\n🎉 Authentication endpoint tests completed!")
    print("\nTo test MetaMask authentication:")
    print("1. Open login.html in browser")
    print("2. Click 'Connect with MetaMask'")
    print("3. Sign the authentication message in MetaMask")
    print("4. Check browser console and network tab for success")

if __name__ == '__main__':
    test_auth_endpoints()