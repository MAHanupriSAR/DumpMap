# 🌍 DumpMap

> An AI-powered, real-time municipal waste tracking and resolution platform.

DumpMap empowers citizens to quickly report illegal dumping and environmental hazards, while equipping municipal authorities with an intelligent, real-time dispatch dashboard to keep their cities clean. 

By leveraging **AWS Rekognition (Computer Vision)**, DumpMap automatically detects and filters out fake reports, ensuring that dispatchers only see verified, actionable data.

---

## ✨ Key Features

### 👤 For Citizens
- **Intuitive 5-Step Reporting**: A frictionless mobile-first UI for capturing location, severity, waste type, and a mandatory photographic evidence upload.
- **Precise Geolocation**: Built on OpenStreetMap and Leaflet to pinpoint exact coordinates for the report.
- **Live Status Tracking**: A beautiful "My Reports" timeline that tracks a report's journey from `Verifying` -> `Cleanup Pending` -> `Resolved` (or `Rejected` if the AI flags it as a false report).

### 🏛️ For Municipal Authorities
- **Municipal Intelligence Dashboard**: A sleek, glassmorphism-styled command center that provides real-time analytics on total reports, active hotspots, and critical hazards.
- **Live Interactive Heatmap**: Instantly visualizes verified waste clusters across the city.
- **Priority Action Matrix**: Automatically sorts reports by severity and time submitted, allowing dispatchers to view full incident details (including the raw photo) and send crews immediately.

### 🤖 AI-Powered Validation
- **Automated Triage**: When a photo is uploaded to S3, a DynamoDB Stream triggers a background AWS Lambda function.
- **AWS Rekognition**: The Computer Vision model scans the photo for keywords like *trash, garbage, plastic, rubble, etc.*
- **Spam Prevention**: Fake reports (e.g., selfies, random scenery) are immediately marked as `Rejected` and hidden from the Admin Dashboard, saving municipal time and resources.

---

## 🛠️ Architecture & Tech Stack

DumpMap is built using a modern, scalable Serverless architecture.

**Frontend:**
- **React (Vite)**: Fast, modern SPA framework.
- **Leaflet & React-Leaflet**: For rich, interactive map integration.
- **AWS Cognito (`react-oidc-context`)**: Secure authentication and identity management.
- **Vanilla CSS**: Hand-crafted, responsive, modern glassmorphism styling.

**Backend (AWS Serverless):**
- **Serverless Framework**: Infrastructure as Code (IaC) managing the entire backend stack.
- **AWS Lambda & API Gateway**: RESTful endpoints for generating S3 upload URLs and managing reports.
- **AWS DynamoDB**: Highly scalable NoSQL database for storing report metadata.
- **AWS S3**: Secure storage for citizen-uploaded photographic evidence.
- **AWS Rekognition**: Deep learning image analysis for automated report verification.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- AWS CLI configured with administrator credentials
- Serverless Framework (`npm install -g serverless`)

### 1. Deploy the Backend
The backend provisions the S3 buckets, DynamoDB tables, and API Gateway endpoints automatically.

```bash
cd backend
npm install
npx serverless deploy
```
*Note the API Gateway endpoints printed in the terminal after a successful deployment. Ensure these endpoints are correctly referenced in the frontend API calls.*

### 2. Run the Frontend
```bash
# Return to the root directory
npm install
npm run dev
```
The application will be available locally at `http://localhost:5173`.

---

## 🔒 Environment Setup (Frontend)

To connect the frontend to your AWS backend, ensure you have your Cognito User Pool details configured. In your frontend environment variables (or directly in `main.jsx`), provide:
- `Authority` (Cognito endpoint)
- `Client ID`
- `Redirect URI`

*(The API Gateway URLs for report submission and fetching are currently configured directly in the frontend components `ReportWaste.jsx`, `MyReports.jsx`, `AdminDashboard.jsx`, and `MapView.jsx`)*

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License
This project is open-source and available under the [MIT License](LICENSE).
