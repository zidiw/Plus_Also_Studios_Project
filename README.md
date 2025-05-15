# Plus_Also_Studios_Project
**Brief Selected:** Brief 1 – Image to Image  
**Project Description:** [Ai Challenge 2025.pdf](Ai%20Challenge%202025.pdf)  
**Author:** Zidi Wei

---

## 🧱 Tech Stack

| Layer       | Stack                          |
|-------------|--------------------------------|
| Frontend    | Next.js + Tailwind CSS         |
| Backend     | FastAPI                        |
| AI Model    | Replicate – `flux-1.1-pro`     |
| Hosting     | Localhost / Cloud platforms    |

---

## 🚀 Running Locally

To run the project on your local machine:

1. **Install Node.js**  
   Download and install from:  
   👉 [https://nodejs.org/en](https://nodejs.org/en)

2. **Install Python dependencies**  
   Make sure you have `pip` and Python 3.8+ installed:

   ```bash
   pip install fastapi uvicorn
   ```

3. **Start the backend**

   ```bash
   cd backend
   python -m uvicorn main:app --reload
   ```

4. **Start the frontend**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Open the app**  
   Visit: [http://localhost:3000/](http://localhost:3000/)

---

## 🌐 Remote Access

Access the live demo here:  
👉 [https://plusalsostudiosprojectfrontend-production.up.railway.app/](https://plusalsostudiosprojectfrontend-production.up.railway.app/)

---

## 🧪 Test Examples

You can test the API in two ways:

1. Provide both an image and a prompt  
2. Provide only a prompt (image is optional)

Sample input images are available in the `test_images` folder, and example requests are provided in the `test_examples` folder.