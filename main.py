import wikipediaapi
import re
import os
import requests
import json
import time


OPENROUTER_API_KEY = os.getenv("OPENAI_API_KEY")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "meta-llama/llama-4-maverick"

GOOGLE_API_KEY = "Get your own"
GOOGLE_CSE_ID = "Get your own"

def get_llm_enhancement(topic, existing_roadmap_str):
    if not OPENROUTER_API_KEY:
        print("OpenRouter API Key not found. Please set OPENROUTER_API_KEY environment variable.")
        return []

    base_prompt = f"""You are an expert learning path designer. 
    
    Design a Structured and completely exhaustive list and
    a comprehensive learning roadmap consisting of a hierarchy of:
    1: Topic and subtopics 
    2: Concepts and Techniques 
    3: Any thing relevant material that is essential to learn to become proficient
    on the topic.
    The roadmap should be structured in a way that it can be followed step by step, starting from the basics and
    progressing to advanced topics. The roadmap should be comprehensive and cover all aspects of the topic.
    The output should be a list of bullet points only, each representing a topic or subtopic.
    Excluding the existing roadmap, there should not be more than 20 items in the roadmap.
    Topic is: {topic}"""

    if existing_roadmap_str:
        prompt = f"""{base_prompt}
        Take into account the info from the existing roadmap provided below, but focus on topics that are not already covered in this existing roadmap, and also identify gaps that need to be filled.
        The existing roadmap is:
        {existing_roadmap_str}"""
    else:
        prompt = base_prompt + " Ensure the roadmap covers all aspects of the topic thoroughly from basic to advanced."
    
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
        print(f"Sending prompt to OpenRouter API for topic: {topic}")

        response = requests.post(OPENROUTER_API_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        result = response.json()

        output_json = json.dumps({"content": result['choices'][0]['message']['content']}, indent=2)

        content = result['choices'][0]['message']['content'].strip()
        
        enhancements = []
        for line in content.split('\n'):
            stripped_line = line.strip()
            if stripped_line.startswith('- '):
                enhancements.append(stripped_line[2:].strip())
            elif stripped_line:
                enhancements.append(stripped_line)
        
        return enhancements
        
    except requests.exceptions.Timeout:
        print("LLM enhancement failed: The request timed out.")
        return []
    except requests.exceptions.RequestException as e:
        print(f"LLM enhancement failed with OpenRouter API (Request Exception): {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response content: {e.response.text}")
        return []
    except Exception as e:
        print(f"LLM enhancement failed with OpenRouter API (General Error): {str(e)}")
        return []

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

def generate_tutorial_article(main_topic, sub_topic, search_enabled=True):
    """
    Generates a tutorial-style article for a given sub-topic.
    Optionally incorporates web search results for freshness.
    """
    if not OPENROUTER_API_KEY:
        return "Error: OpenRouter API key not set."

    print(f"  Generating tutorial for: {sub_topic} (under {main_topic})...")

    search_context = ""
    if search_enabled and (GOOGLE_API_KEY and GOOGLE_CSE_ID):
        sub_topic = sub_topic.replace("*", "")
        search_query = f"{sub_topic} {main_topic} tutorial"
        print(f" Performing web search for: {search_query}")
        snippets = Google_Search(search_query)
        print(f" Found {len(snippets)} relevant snippets. ")
        print(" Snippets:", snippets)
        if snippets:
            search_context = "\n\nRelevant web search results:\n" + "\n".join(snippets) + "\n\n"
        else:
            print("No useful web search results found.")

    prompt = f"""You are an expert educator and content creator.
    
    Generate a detailed and verbose, tutorial-style article for the topic: "{sub_topic}".
    This topic is part of a larger learning path on "{main_topic}".
    
    The article should:
    1. Start with the absolute basics of "{sub_topic}".
    2. Progress step-by-step to intermediate and advanced concepts related to "{sub_topic}".
    3. Explain core concepts clearly and with great detail.
    4. Include practical examples or analogies or code where appropriate or necessary.
    5. Be structured with headings and subheadings (using Markdown: #, ##, ###).
    6. Cover essential techniques, tools, and best practices.
    7. Be suitable for someone with no prior knowledge of the topic.
    8. Further reading section must include important and useful links for resources like articles, documentations, or other text resources about {sub_topic}.

    
    Focus on providing more actionable knowledge for someone looking to learn this topic thoroughly.
    {search_context}
    Please ensure the content flows logically from simple to complex.
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
        print(f"  Tutorial generation for '{sub_topic}' failed: The request timed out.")
        return "Error: LLM request timed out."
    except requests.exceptions.RequestException as e:
        print(f"  Tutorial generation for '{sub_topic}' failed (Request Exception): {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"  Response content: {e.response.text}")
        return "Error: LLM request failed."
    except Exception as e:
        print(f"  An unexpected error occurred during tutorial generation for '{sub_topic}': {str(e)}")
        return "Error: An unexpected error occurred."


def get_wikipedia_roadmap(topic):
    wiki = wikipediaapi.Wikipedia(
        language='en',
        extract_format=wikipediaapi.ExtractFormat.WIKI,
        user_agent="AI_RoadmapGenerator/1.0"
    )
    
    outline_page = wiki.page(f"Outline_of_{topic}")
    if outline_page.exists():
        print(f"Found Wikipedia outline for 'Outline_of_{topic}'")
        return parse_wikipedia_page(outline_page)
    
    main_page = wiki.page(topic)
    if main_page.exists():
        print(f"Found main Wikipedia page for '{topic}'")
        return parse_wikipedia_page(main_page)
    
    print(f"No relevant Wikipedia page found for '{topic}'")
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
    base_roadmap = get_wikipedia_roadmap(topic.replace(" ", "_"))
    
    if base_roadmap is None:
        print(f"\n⚠️ No Wikipedia foundation found for '{topic}'. Proceeding with LLM-only generation.")
        base_roadmap = []
        existing_roadmap_for_llm = ""
    else:
        existing_roadmap_for_llm = "\n".join(base_roadmap)
        
    enhancements = []
    if OPENROUTER_API_KEY:
        print("🔍 Attempting to enhance/generate roadmap via LLM...")
        enhancements = get_llm_enhancement(topic, existing_roadmap_for_llm)
        if enhancements:
            print(f"LLM generated {len(enhancements)} enhancements.")
        else:
            print("LLM generated no additional enhancements.")
    else:
        print("⚠️ OPENROUTER_API_KEY not set. Using Wikipedia-only results (if available).")
    
    final_roadmap = base_roadmap[:]
    if enhancements:
        if not base_roadmap:
            final_roadmap = enhancements
        else:
            final_roadmap.append("\n- Modern & Advanced Topics (LLM-Enhanced)")
            for item in enhancements:
                if item not in final_roadmap:
                    final_roadmap.append(f"  - {item}")
    
    return final_roadmap

if __name__ == "__main__":
    topic = input("Enter a learning topic: ").strip()
    if not topic:
        topic = "Large Language Models"
    
    print(f"\n🚀 Generating '{topic}' learning roadmap...")
    start_time = time.time()
    
    roadmap = generate_learning_roadmap(topic)
    
    print(f"\n📚 Comprehensive Learning Roadmap: {topic}")
    if roadmap:
        for item in roadmap:
            print(item)
    else:
        print("No roadmap could be generated for this topic.")
    
    print(f"\n✅ Generated in {time.time()-start_time:.1f}s")
    print("💡 Tip: Start with foundational topics then progress to modern applications")

    if roadmap:
        print(f"\n📝 Starting tutorial generation for '{topic}' roadmap items...")
        
        output_dir = f"tutorials_{topic.replace(' ', '_').lower()}"
        os.makedirs(output_dir, exist_ok=True)
        print(f"Tutorials will be saved in: '{output_dir}/'")

        article_count = 0
        for item in roadmap:
            clean_item = item.strip()
            if clean_item.startswith('- '):
                clean_item = clean_item[2:].strip()

            if not clean_item or clean_item.startswith("Modern & Advanced Topics"):
                continue

            article_content = generate_tutorial_article(topic, clean_item, search_enabled=True)
            
            if article_content and not article_content.startswith("Error:"):
                filename = re.sub(r'[^\w\s-]', '', clean_item).strip().replace(' ', '_')[:50] + ".md"
                filepath = os.path.join(output_dir, filename)
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(f"# {clean_item}\n\n")
                    f.write(article_content)
                print(f"  Successfully generated '{filepath}'")
                article_count += 1
            else:
                print(f"  Failed to generate article for '{clean_item}': {article_content}")
            
            time.sleep(2)

        print(f"\n🎉 Finished generating {article_count} tutorial articles.")
    else:
        print("\nSkipping tutorial generation as no roadmap was created.")


# 👇 This is the custom google search engine visuals code for resource searching.
#<script async src="https://cse.google.com/cse.js?cx=c582d02e4976d4989">
#</script>
#<div class="gcse-search"></div>



# Note: TO ACCESS ROADMAP OUTPUT IN JSON FORMAT 👇.
# USE VARIABLE "output_json" IN THE get_llm_enhancement FUNCTION UNDER THE TRY BLOCK. 