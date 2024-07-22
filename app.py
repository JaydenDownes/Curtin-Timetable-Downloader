from flask import Flask, render_template, send_from_directory

app = Flask(__name__, static_url_path='/static')

# Route to serve index.html or any other HTML file
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def signin():
    return render_template('login.html')

@app.route('/app')
def app_page():
    return render_template('app.html')

# Route to serve all other static files from the 'static' directory
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    app.run()
