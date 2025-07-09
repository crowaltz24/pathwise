# Pathwise

Pathwise is a React/Flask/Supabase based web platform that helps users create personalized learning roadmaps (Paths) for any topic. Powered by AI, it generates step-by-step guides to help users master their chosen topics. Created for CodeVerse Hackathon 2025.

## Features
- User auth
- AI roadmap and content generation
- Utilize Google Search API context for content
- Contextual doubt clearing AI chatbot
- Note-taking feature
- Secure learning path data storage with Supabase
- Dashboard functionality
- Settings page

### To-Do
- Improve "Further Reading" section links
- User API keys implementation instead of hardcoded
- Dark theme?

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

8. I serve the site via the Flask server, so in your deployment you can move the `build` folder into `backend` and start from there:
   ```bash
   python main.py
   ```
   Or just do whatever you prefer.

### Environment Configuration
Ensure your `.env` file is configured correctly in the root directory as follows:
```
PYTHONIOENCODING=utf-8

REACT_APP_API_BASE_URL=

REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=

GOOGLE_API_KEY=
GOOGLE_CSE_ID=

OPENROUTER_API_KEY=
```

### Notes
- Your API base URL is wherever you're serving your Flask endpoints - I only put it into env to hotswap it for local dev (probably better ways to do this but whatever)
- Works on the assumption that the Supabase tables are structured as expected
- Needs Google Custom Search API and a Programmable Search Engine thingy, but if you don't wanna deal with that then you can just remove the parts where it needs them in `main.py`
- In case you do remove the Google Search context stuff, I think you're okay removing `PYTHONIOENCODING` from your environment variables, too. I'm not super sure why I put it in there either
- Don't forget your OpenRouter key for all your LLM needs! (which will be Many. have you SEEN this project)

## <3