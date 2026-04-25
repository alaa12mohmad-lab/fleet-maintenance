# Setup Scripts

## setup-admin.mjs

Creates the admin user document in Firestore after you have created the
Firebase Auth account manually.

### Steps

```bash
# 1. Install firebase-admin
npm install firebase-admin

# 2. Download your service account key:
#    Firebase Console → Project Settings →
#    Service Accounts → Generate new private key
#    Save it here as: scripts/serviceAccountKey.json

# 3. Run the script (from the project root)
node scripts/setup-admin.mjs
```

> **⚠️ Security**: Never commit `serviceAccountKey.json` to git.
> It is already listed in `.gitignore`.
