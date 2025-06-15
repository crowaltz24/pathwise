# Pathwise

Pathwise is a web platform that helps users create personalized learning roadmaps for any topic. Powered by AI, it generates step-by-step guides to help users master their chosen topics. Work in progress!

## Features
- User auth
- AI roadmap and content generation
- Secure learning path data storage with Supabase
- Dashboard functionality
- Note-taking feature

## To-Do
- Markdown Table rendering for main content window
- Contextual doubt clearing AI chatbot (using current open content section)
- Fix "Further Reading" section links being broken (they're currently mostly AI generated, I might route via search api for additional context)
- Settings page
- User API keys implementation instead of hardcoded

### Prerequisites
- Node.js (v18 or later ideally)
- npm
- Python (v3.10 or later)

## Installation (development)
1. Clone the repo:
   ```bash
   git clone https://github.com/crowaltz24/pathwise.git
   cd pathwise
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

3. Navigate to `backend`:
   ```bash
   cd backend
   ```
4. Create a Python venv:
   ```bash
   python -m venv venv
   ```
5. Activate the venv:
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
6. Install the required python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

7. Start the development server:
   ```bash
   npm start
   ```

   `npm start` activates the venv, starts the backend Flask server as well as the React development server simulatenously.

### Environment Configuration
Ensure your `.env` file is configured correctly in the root directory. Below are the required keys (FOR NOW):


```
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_api_key
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CSE_ID=your_google_cse_id
```

### Notes
- The Supabase URL is hardcoded for our project, but you can always modify `supabaseClient.ts` for if needed
