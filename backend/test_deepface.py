import os
import sys

# Setup paths
sys.path.append(r'c:\Users\rishi\Documents\rishi-codes\_Hackethon2k26\backend')

try:
    print("Importing DeepFace...")
    from deepface import DeepFace
    print("DeepFace imported successfully.")

    # Optional: Try to build a dummy model to ensure weights leverage works or at least imports
    # This might trigger a download, so we just check imports for now to be safe and fast.
    print("DeepFace is ready to use.")
except Exception as e:
    print(f"DeepFace Import Failed: {e}")
    sys.exit(1)
