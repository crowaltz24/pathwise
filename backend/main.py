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

app = Flask(__name__, static_folder="build", static_url_path="")
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

        try:
            parsed_response = json.loads(content)
            if isinstance(parsed_response, list) and all(isinstance(item, str) for item in parsed_response):
                return parsed_response
            elif isinstance(parsed_response, dict) and "error" in parsed_response:
                return {"error": parsed_response["error"]}
            else:
                return {"error": "Unexpected response format from the AI. Please try again later."}
        except json.JSONDecodeError:
            return {"error": "Failed to parse the AI response. Please try again later."}

    except requests.exceptions.RequestException:
        return {"error": "Failed to connect to the AI service. Please try again later."}

def Google_Search(query):
    """Performs a Google Custom Search and returns snippet results."""
    if not GOOGLE_API_KEY or not GOOGLE_CSE_ID:
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
    except requests.exceptions.RequestException:
        return []
    except Exception:
        return []

def generate_tutorial_article(main_topic, sub_topic, roadmap, search_enabled=True):
    """
    Generates a learning guide-style article for a given sub-topic.
    Optionally incorporates web search results for freshness.
    """
    if not OPENROUTER_API_KEY:
        return "Error: OpenRouter API key not set."

    search_context = ""
    if search_enabled and (GOOGLE_API_KEY and GOOGLE_CSE_ID):
        sub_topic = sub_topic.replace("*", "")
        search_query = f"{sub_topic} {main_topic} guide"
        snippets = Google_Search(search_query)
        if snippets:
            search_context = "\n\nRelevant web search results:\n" + "\n".join(snippets) + "\n\n"

    prompt = f"""You are an expert educator and content creator.

    Generate a detailed learning guide for the sub-topic: "{sub_topic}".
    This sub-topic is part of a larger learning roadmap on "{main_topic}".
    
    The roadmap for this topic is as follows:
    {roadmap}

    IMPORTANT:
    - Do NOT preemptively generate detailed content for any other sections or sub-topics in the roadmap. Stick to the CURRENT topic provided.
    - You may briefly mention future sub-topics to provide context, but leave their detailed content for their respective articles.
    - Focus ONLY on the sub-topic "{sub_topic}".
    - Ensure the content is specific to the main topic "{main_topic}" to avoid irrelevant information.
    - Do not spoil sections that are yet to come.
    - If you can't talk about the current sub-topic without referencing future sections, you may shorten the current content to a satisfactory level and mention that more details will be covered in future sections.

    The guide should:
    1. Start with the basics of "{sub_topic}".
    2. Progress step-by-step to intermediate and advanced concepts related to "{sub_topic}".
    3. Avoid tutorial-like language such as "In this article, we will guide you...".
    4. Use direct and concise language like "You're about to learn..." or "Here, you'll explore...".
    5. Avoid unnecessary references to the user and focus on delivering actionable knowledge.
    6. Be structured with headings and subheadings (using Markdown: #, ##, ###). Use bold, itaiics, lists, code blocks, maths and any other formatting and beautification if necessary, consistently throughout the content.
    7. Cover essential techniques, tools, good practices, examples and any relevant material for mastering "{sub_topic}".
    8. Ensure the content is comprehensive, covering all relevant aspects of "{sub_topic}" and NOT beyond it.
    9. Provide further reading suggestions and resources at the end of the article, as well as links to them.
    10. You may reference other sections and sub-topics in the roadmap for context, but do not include their content here. (Example: "For more on X, see the section on Y in the roadmap." Avoid linking them, just mention them.)
    11. When generating hyperlinks, use the format [text](URL) for Markdown links, but do not provide placeholder text such as "(link to relevant resource". Only provide a hyperlink if you have a specific URL to link to.
    
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
        print(f"Sending request to OpenRouter API with payload: {payload}")  # Log request payload
        response = requests.post(OPENROUTER_API_URL, headers=headers, json=payload, timeout=120)
        response.raise_for_status()
        result = response.json()
        print(f"OpenRouter API Response: {result}")  # Log API response
        article_content = result['choices'][0]['message']['content'].strip()
        return article_content
    except Exception as e:
        print(f"Error in generate_tutorial_article: {e}")  # Log the error
        raise

def get_wikipedia_roadmap(topic):
    wiki = wikipediaapi.Wikipedia(
        language='en',
        extract_format=wikipediaapi.ExtractFormat.WIKI,
        user_agent="AI_RoadmapGenerator/1.0"
    )
    
    outline_page = wiki.page(f"Outline_of_{topic}")
    if outline_page.exists():
        return parse_wikipedia_page(outline_page)
    
    main_page = wiki.page(topic)
    if main_page.exists():
        return parse_wikipedia_page(main_page)
    
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

    enhancements = get_llm_enhancement(topic, existing_roadmap_str="")

    if not enhancements:
        return []

    return enhancements

@app.route('/generate-roadmap', methods=['POST'])
def generate_roadmap_endpoint():
    data = request.json
    topic = data.get('topic', '')

    if not topic:
        return jsonify({'error': 'Topic is required'}), 400

    try:
        roadmap = generate_learning_roadmap(topic)
        return jsonify({'roadmap': roadmap})
    except Exception:
        return jsonify({'error': 'Failed to generate roadmap'}), 500

@app.route('/generate-content', methods=['POST'])
def generate_content_endpoint():
    data = request.json
    section = data.get('section', '').strip()
    main_topic = data.get('main_topic', '').strip()
    roadmap = data.get('roadmap', [])

    if not section or not main_topic or not roadmap:
        return jsonify({"error": "Section, main_topic, and roadmap are required"}), 400

    try:
        print(f"Payload received: section={section}, main_topic={main_topic}, roadmap={roadmap}")
        content = generate_tutorial_article(main_topic=main_topic, sub_topic=section, roadmap=roadmap)
        return jsonify({"content": content}), 200
    except Exception as e:
        print(f"Error generating content: {e}")
        return jsonify({"error": f"Failed to generate content: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))