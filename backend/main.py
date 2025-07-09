import wikipediaapi
import re
import os
import requests
import json
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

load_dotenv()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "meta-llama/llama-4-maverick"

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GOOGLE_CSE_ID = os.getenv("GOOGLE_CSE_ID")

app = Flask(__name__)
CORS(app)  # CORS for all routes

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(e):
    # have to serve index.html for unknown routes so that site routes correctly on refresh!
    return send_from_directory(app.static_folder, 'index.html')

def get_llm_enhancement(topic, existing_roadmap_str):
    if not OPENROUTER_API_KEY:
        raise ValueError("OpenRouter API Key not found. Please set OPENROUTER_API_KEY environment variable.")

    base_prompt = f"""You are an expert learning path designer. 
    
    Design a structured and exhaustive learning roadmap for the topic "{topic}".
    The roadmap must:
    - Be a hierarchy of topics and subtopics.
    - Include concepts, techniques, and any relevant material essential for proficiency.
    - Be structured step-by-step, starting from the basics and progressing to advanced topics.
    - Be comprehensive and cover all aspects of the topic.
    - Be formatted as a JSON array of strings, where each string represents a numbered topic or subtopic.
    - ENSURE THAT SUBTOPICS ARE INDENTED PROPERLY to visually distinguish them from main topics.
    - Contain between 8 and 20 items in the roadmap, depending on the complexity of the topic.
    - If the topic is inappropriate, invalid, or cannot have a meaningful roadmap, return a JSON object with an "error" key and a descriptive error message.
    - DO NOT include any commentary, explanations, or additional text outside the JSON response.

    Example output for a valid topic:
    [
        "1. Introduction to {topic}",
        "2. Core Concepts",
        "   2.1 Subtopic 1",
        "   2.2 Subtopic 2",
        "3. Advanced Techniques",
        "   3.1 Subtopic 3"
    ]

    Example output for an invalid topic:
    {{
        "error": "The topic '{topic}' is inappropriate or cannot have a meaningful roadmap."
    }}

    Topic: {topic}"""

    if existing_roadmap_str:
        prompt = f"""{base_prompt}
        Take into account the existing roadmap provided below, but focus on topics not already covered and identify gaps to be filled.
        Existing roadmap:
        {existing_roadmap_str}"""
    else:
        prompt = base_prompt

    print(f"LLM Prompt: {prompt}")
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "X-Title": "RoadmapGeneratorApp" 
    }
    
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 2500,
        "temperature": 0.55,
    }
    
    try:
        response = requests.post(OPENROUTER_API_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        result = response.json()

        content = result['choices'][0]['message']['content'].strip()
        print(f"LLM Raw Response: {content}")  # debugging

        try:
            parsed_response = json.loads(content)
            if isinstance(parsed_response, list) and all(isinstance(item, str) for item in parsed_response):
                return parsed_response
            elif isinstance(parsed_response, dict) and "error" in parsed_response:
                return {"error": parsed_response["error"]}
            else:
                print("Error: LLM response is not a valid JSON format.")
                return {"error": "Unexpected response format from the AI. Please try again later."}
        except json.JSONDecodeError:
            print("Error: Failed to parse the AI response as JSON.")
            print(f"Raw Response: {content}")  # debugging
            return {"error": "Failed to parse the AI response. Please try again later."}

    except requests.exceptions.RequestException as e:
        print(f"Error: LLM request failed - {e}")
        return {"error": "Failed to connect to the AI service. Please try again later."}

def Google_Search(query):
    """Performs a Google Custom Search and returns snippet results."""
    if not GOOGLE_API_KEY or not GOOGLE_CSE_ID:
        print("Google Search API keys not set. Skipping web search.")
        return []
    
    search_url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "key": GOOGLE_API_KEY,
        "cx": GOOGLE_CSE_ID,
        "q": query,
        "num": 3
    }
    
    try:
        response = requests.get(search_url, params=params, timeout=10)
        response.raise_for_status()
        search_results = response.json()
        
        snippets = []
        if 'items' in search_results:
            for item in search_results['items']:
                snippets.append(item.get('snippet', ''))
        return snippets
    except requests.exceptions.RequestException as e:
        print(f"Google Search failed: {e}")
        return []
    except Exception as e:
        print(f"An unexpected error occurred during Google Search: {e}")
        return []

def generate_tutorial_article(main_topic, sub_topic, roadmap, search_enabled=True):
    """
    Generates a learning guide-style article for a given sub-topic.
    Optionally incorporates web search results for freshness.
    """
    if not OPENROUTER_API_KEY:
        return "Error: OpenRouter API key not set."

    print(f"Generating content for sub-topic: {sub_topic} (under main topic: {main_topic})...")

    search_context = ""
    if search_enabled and (GOOGLE_API_KEY and GOOGLE_CSE_ID):
        sub_topic = sub_topic.replace("*", "")
        search_query = f"{sub_topic} {main_topic} guide"
        print(f"Performing web search for: {search_query}")
        snippets = Google_Search(search_query)
        print(f"Found {len(snippets)} relevant snippets.")
        print("Snippets:", snippets)
        if snippets:
            search_context = "\n\nRelevant web search results:\n" + "\n".join(snippets) + "\n\n"
        else:
            print("No useful web search results found.")

    prompt = f"""You are an expert educator and content creator.

    Generate a detailed learning guide for the sub-topic: "{sub_topic}".
    This sub-topic is part of a larger learning roadmap on "{main_topic}".
    
    The roadmap for this topic is as follows:
    {roadmap}

    IMPORTANT:
    - Do NOT preemptively generate detailed content for future sub-topics in the roadmap.
    - You may briefly mention future sub-topics to provide context, but leave their detailed content for their respective articles.
    - Focus ONLY on the sub-topic "{sub_topic}".
    - Ensure the content is specific to the main topic "{main_topic}" to avoid irrelevant information.

    The guide should:
    1. Start with the basics of "{sub_topic}".
    2. Progress step-by-step to intermediate and advanced concepts related to "{sub_topic}".
    3. Avoid tutorial-like language such as "In this article, we will guide you...".
    4. Use direct and concise language like "You're about to learn..." or "Here, you'll explore...".
    5. Avoid unnecessary references to the user and focus on delivering actionable knowledge.
    6. Be structured with headings and subheadings (using Markdown: #, ##, ###). Use lists, code blocks, maths and any other formatting and beautification if necessary.
    7. Cover essential techniques, tools, good practices, and any relevant material for mastering "{sub_topic}".
    8. Ensure the content is comprehensive, covering all relevant aspects of "{sub_topic}" and NOT beyond it.
    9. Provide further reading suggestions and resources at the end of the article, as well as links to them.

    {search_context}

    The article should be well-structured, informative, and engaging. Please ensure the content flows logically.
    """

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "X-Title": "RoadmapTutorialGenerator"
    }

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 6000,
        "temperature": 0.7,
    }

    try:
        response = requests.post(OPENROUTER_API_URL, headers=headers, json=payload, timeout=120)
        response.raise_for_status()
        result = response.json()
        article_content = result['choices'][0]['message']['content'].strip()
        return article_content
    except requests.exceptions.Timeout:
        print(f"Content generation for '{sub_topic}' failed: The request timed out.")
        return "Error: LLM request timed out."
    except requests.exceptions.RequestException as e:
        print(f"Content generation for '{sub_topic}' failed (Request Exception): {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response content: {e.response.text}")
        return "Error: LLM request failed."
    except Exception as e:
        print(f"An unexpected error occurred during content generation for '{sub_topic}': {str(e)}")
        return "Error: An unexpected error occurred."


def get_wikipedia_roadmap(topic):
    wiki = wikipediaapi.Wikipedia(
        language='en',
        extract_format=wikipediaapi.ExtractFormat.WIKI,
        user_agent="AI_RoadmapGenerator/1.0"
    )
    
    outline_page = wiki.page(f"Outline_of_{topic}")
    print(f"Checking Wikipedia page: Outline_of_{topic}")  # page being checked
    if outline_page.exists():
        print(f"Found outline page for {topic}")  # page exists?
        print(f"Outline page content:\n{outline_page.text[:1000]}")
        return parse_wikipedia_page(outline_page)
    
    main_page = wiki.page(topic)
    print(f"Checking Wikipedia page: {topic}")
    if main_page.exists():
        print(f"Found main page for {topic}")
        print(f"Main page content:\n{main_page.text[:1000]}")
        return parse_wikipedia_page(main_page)
    
    print(f"No Wikipedia page found for {topic}")
    return None

def parse_wikipedia_page(page):
    roadmap = []
    
    def process_sections(sections, level=1):
        for s in sections:
            if level > 3 or "See also" in s.title or "References" in s.title or "External links" in s.title or "Notes" in s.title or "Further reading" in s.title:
                continue
            title = re.sub(r'\[\w+\]', '', s.title).strip()
            if title:
                indent = "  " * (level - 1)
                roadmap.append(f"{indent}- {title}")
                if s.sections:
                    process_sections(s.sections, level + 1)
    
    process_sections(page.sections)
    return roadmap

def generate_learning_roadmap(topic):
    """
    Generates a learning roadmap for the given topic using the LLM.
    """
    if not OPENROUTER_API_KEY:
        raise ValueError("OpenRouter API Key not found. Please set OPENROUTER_API_KEY environment variable.")

    print(f"Generating roadmap for topic: {topic}") # debugging

    enhancements = get_llm_enhancement(topic, existing_roadmap_str="")  # existing roadmap not passed (i removed wikipedia for roadmap)

    if not enhancements:
        print(f"Error: LLM failed to generate a roadmap for topic: {topic}")
        return []

    final_roadmap = enhancements
    print(f"Generated roadmap: {final_roadmap}")
    return final_roadmap

@app.route('/generate-roadmap', methods=['POST'])
def generate_roadmap_endpoint():
    data = request.json
    topic = data.get('topic', '')

    if not topic:
        return jsonify({'error': 'Topic is required'}), 400

    try:
        roadmap = generate_learning_roadmap(topic)
        return jsonify({'roadmap': roadmap})
    except Exception as e:
        print(f"Error generating roadmap: {e}")
        return jsonify({'error': 'Failed to generate roadmap'}), 500

@app.route('/generate-content', methods=['POST'])
def generate_content_endpoint():
    data = request.json
    section = data.get('section', '')

    if not section:
        return jsonify({'error': 'Section is required'}), 400

    try:
        content = generate_tutorial_article(main_topic="Roadmap Topic", sub_topic=section)
        return jsonify({'content': content})
    except Exception as e:
        print(f"Error generating content: {e}")
        return jsonify({'error': 'Failed to generate content'}), 500

@app.route('/generate-chat-response', methods=['POST'])
def generate_chat_response():
    data = request.json
    user_query = data.get('query', '')
    context = data.get('context', '')

    if not user_query or not context:
        return jsonify({'error': 'Query and context are required'}), 400

    prompt = f"""You are an expert assistant. Answer the user's question based on the following context:

    Context:
    {context}

    User's question:
    {user_query}

    Provide a detailed and accurate response. Use markdown formatting for clarity, including code blocks, lists, and math rendering if necessary."""

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1000,
        "temperature": 0.7,
    }

    try:
        response = requests.post(OPENROUTER_API_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        result = response.json()
        return jsonify({'response': result['choices'][0]['message']['content'].strip()})
    except requests.exceptions.RequestException as e:
        print(f"Error generating chat response: {e}")
        return jsonify({'error': 'Failed to generate chat response'}), 500

if __name__ == "__main__":
    try:
        app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)
    except Exception as e:
        print(f"Error starting the application: {e}")