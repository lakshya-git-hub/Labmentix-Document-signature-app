# Document Signature App (DocuSign Clone)

A full-stack MERN application to upload, view, sign, and share PDF documents securely, with audit logging and signature management.

## Tech Stack
- **Frontend:** React, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **PDF Processing:** PDF-Lib
- **File Uploads:** Multer
- **Authentication:** JWT, bcrypt

## Folder Structure
```
signature-app/
|-- client/
|   |-- src/
|       |-- components/
|       |-- pages/
|       |-- utils/
|-- server/
|   |-- controllers/
|   |-- models/
|   |-- routes/
|   |-- middleware/
|   |-- utils/
|-- .env.example
|-- README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- npm or yarn
- MongoDB (local or Atlas)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd signature-app
```

### 2. Setup Backend
```bash
cd server
npm install
cp ../.env.example .env # Edit with your MongoDB URI and JWT secret
npm run dev
```

### 3. Setup Frontend
```bash
cd ../client
npm install
npm start
```

### 4. Usage
- Register/login as a user
- Upload PDF documents
- Add and manage signatures
- Share documents for signing
- View audit logs

## Public Signing
- Share a document using the "Share for Signature" button in the dashboard.
- The recipient can open the public link, view the PDF, and place a signature without logging in.

## Deployment
- Backend: Deploy to Render, Railway, or any Node.js host.
- Frontend: Deploy to Vercel, Netlify, or similar.
- MongoDB: Use MongoDB Atlas or your preferred provider.

## Demo
- Register/login as a user.
- Upload a PDF, place signature fields, and share for external signing.
- Recipients can sign via the public link.
- View audit trail and signature status in your dashboard.

---

For questions or contributions, open an issue or pull request!

---

## API Endpoints
See the full API documentation in the `/server/routes` folder.

---

## License
MIT 