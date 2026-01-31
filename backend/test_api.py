import requests
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def test_backend():
    # 1. Register User
    user_data = {"username": "hackuser", "password": "securepassword123", "email": "user@test.com"}
    response = requests.post(f"{BASE_URL}/register/", data=user_data)
    if response.status_code == 201:
        print("User Registered.")
    elif response.status_code == 400 and "username" in response.json():
        print("User already exists.")
    else:
        print(f"Registration Failed: {response.text}")
        sys.exit(1)

    # 2. Login User
    response = requests.post(f"{BASE_URL}/login/", data={"username": "hackuser", "password": "securepassword123"})
    if response.status_code == 200:
        user_token = response.json()['token']
        print(f"User Logged In. Token: {user_token[:10]}...")
    else:
        print(f"User Login Failed: {response.text}")
        sys.exit(1)

    # 3. Login Admin
    response = requests.post(f"{BASE_URL}/login/", data={"username": "admin", "password": "adminpass"})
    if response.status_code == 200:
        admin_token = response.json()['token']
        print(f"Admin Logged In. Token: {admin_token[:10]}...")
    else:
        print(f"Admin Login Failed: {response.text}")
        sys.exit(1)

    # 4. Generate Invite (Admin Action)
    headers = {"Authorization": f"Token {admin_token}"}
    response = requests.post(f"{BASE_URL}/admin/generate-invite/", data={"username": "hackuser"}, headers=headers)
    if response.status_code == 201:
        print("Invite Generated.")
    elif response.status_code == 400:
        print("Invite already exists (Expected if re-running).")
    else:
        print(f"Invite Generation Failed: {response.text}")
        sys.exit(1)

    # 5. Get My QR (User Action)
    headers = {"Authorization": f"Token {user_token}"}
    response = requests.get(f"{BASE_URL}/my-qr/", headers=headers)
    if response.status_code == 200:
        print("QR Data Retrieved Successfully.")
        print(response.json())
    else:
        print(f"Get QR Failed: {response.text}")
        sys.exit(1)

if __name__ == "__main__":
    try:
        test_backend()
    except Exception as e:
        print(f"Test Failed with Exception: {e}")
        sys.exit(1)
