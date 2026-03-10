from flask import Flask
from flask_cors import CORS
from routes import main_blueprint
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for entire application

app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  
app.config['SECRET_KEY'] = 'energy_forecast_secret_key'

app.register_blueprint(main_blueprint)

if __name__ == '__main__':
    app.run(debug=os.getenv("FLASK_DEBUG", "false").lower() == "true", port=int(os.getenv("PORT", "5001")))
