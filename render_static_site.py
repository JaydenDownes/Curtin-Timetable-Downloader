import os
import shutil
from flask import Flask, render_template, send_from_directory

app = Flask(__name__)

# Define your routes and rendering logic here
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def signin():
    return render_template('login.html')

@app.route('/app')
def app_page():
    return render_template('app.html')

def render_and_save_template(template_name, output_path):
    with app.test_request_context():
        rendered = render_template(template_name)
        with open(output_path, 'w') as f:
            f.write(rendered)

def main():
    templates_dir = 'templates'
    static_dir = 'static'
    output_dir = 'output'

    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir)

    # Render templates
    for template_name in os.listdir(templates_dir):
        if template_name.endswith('.html'):
            output_path = os.path.join(output_dir, template_name)
            render_and_save_template(template_name, output_path)

    # Copy static files
    shutil.copytree(static_dir, os.path.join(output_dir, static_dir))

if __name__ == "__main__":
    main()
