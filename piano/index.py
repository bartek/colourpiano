from flask import Flask, render_template

app = Flask(__name__)
app.debug = True

@app.route("/")
def index():
    return render_template('/index.html')

@app.route("/get")
def get_initial():
    """
    Get the initial set of images to populate the client with.
    """
    pass


if __name__ == "__main__":
    app.run()
