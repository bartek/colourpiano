from flask import Flask, render_template, make_response, jsonify

from fivehundred import FiveHundredApi
from colours import ImageProcess

import settings

app = Flask(__name__)
app.debug = True

app.fivehundred = FiveHundredApi(
    consumer_key=settings.CONSUMER_KEY,
    consumer_secret=settings.CONSUMER_SECRET,
    debug=True,
)

@app.route("/")
def index():
    return render_template('/index.html')

@app.route("/photos/<feature>/")
def photos(feature='upcoming'):
    """
    Get the initial set of images to populate the client with.
    """
    data = app.fivehundred.photos(feature)
    
    # Fetch each image and base 64 encode it?
    import urllib
    import base64

    for photo in data['photos']:
        photo['image_encoded'] = base64.b64encode(
            urllib.urlopen(photo['image_url']).read()
        )
        
    return jsonify(data)

if __name__ == "__main__":
    app.run()
