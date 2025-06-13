import sys
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import generate_learning_roadmap, generate_tutorial_article

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}}, supports_credentials=True)  # needs both localhost (frontend react) and 127.0.0.1 (backend flask)

@app.route('/generate-roadmap', methods=['POST'])
def generate_roadmap():
    """
    Endpoint to generate a learning roadmap for a given topic.
    """
    data = request.json
    topic = data.get('topic', '').strip()
    print(f"Received topic: {topic}")  # debugging

    if not topic:
        return jsonify({"error": "Topic is required"}), 400

    try:
        roadmap = generate_learning_roadmap(topic)
        print(f"Generated roadmap: {roadmap}")  # debugging
        return jsonify({"roadmap": roadmap}), 200
    except Exception as e:
        print(f"Error generating roadmap: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/generate-content', methods=['POST'])
def generate_content():
    """
    Endpoint to generate content for a specific section of the roadmap.
    """
    data = request.json
    section = data.get('section', '').strip()
    main_topic = data.get('main_topic', '').strip()  # main topic is passed
    roadmap = data.get('roadmap', [])  # roadmap is passed

    print(f"Received section: {section}")  # debugging
    print(f"Received main topic: {main_topic}")  # debugging
    print(f"Received roadmap: {roadmap}")  # debugging

    if not section or not main_topic or not roadmap:
        return jsonify({"error": "Section, main_topic, and roadmap are required"}), 400

    try:
        content = generate_tutorial_article(main_topic=main_topic, sub_topic=section, roadmap=roadmap)
        print(f"Generated content: {content[:100]}...")  # debugging
        return jsonify({"content": content}), 200
    except Exception as e:
        print(f"Error generating content: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting Flask server on http://127.0.0.1:5000...")
    app.run(debug=True)
