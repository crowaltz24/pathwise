import sys
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import generate_learning_roadmap

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}}, supports_credentials=True)  # Allow both localhost and 127.0.0.1

@app.route('/generate-roadmap', methods=['POST'])
def generate_roadmap():
    data = request.json
    topic = data.get('topic', '').strip()
    print(f"Received topic: {topic}")  # topic for debugging
    if not topic:
        return jsonify({"error": "Topic is required"}), 400

    try:
        roadmap = generate_learning_roadmap(topic)
        print(f"Generated roadmap: {roadmap}")
        return jsonify({"roadmap": roadmap}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting Flask server on http://127.0.0.1:5000...")
    app.run(debug=True)
