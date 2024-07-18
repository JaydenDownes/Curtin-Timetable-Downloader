from flask import Flask, render_template


app = Flask(__name__, static_url_path='/static')


@app.route('/')
def index():
    return render_template('index.html')


# Route to serve app.js
@app.route('/static/app.js')
def serve_js():
    return app.send_static_file('app.js')


if __name__ == '__main__':
    app.run(debug=True)
