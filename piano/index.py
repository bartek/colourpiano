import urllib
import base64
from flask import Flask, render_template, make_response, jsonify, request

from fivehundred import FiveHundredApi
from colours import ImageProcess

import settings

app = Flask(__name__)
app.debug = True

app.fivehundred = FiveHundredApi(
    consumer_key=settings.CONSUMER_KEY,
    consumer_secret=settings.CONSUMER_SECRET,
)

@app.route("/")
def index():
    return render_template('/index.html')

@app.route("/photos/<feature>/")
def photos(feature='upcoming', methods=['GET']):
    """
    Get the initial set of images to populate the client with.
    """
    # request.args should be sent as the kwargs to the api.
    kwargs = dict((k, v) for k, v in request.args.items())

    data = app.fivehundred.photos(feature, **kwargs)
    
    # Hacky hacky. Send images as base64 to the client so that they can be
    # read via Canvas for pixel detection
    for photo in data['photos']:
        photo['image_encoded'] = base64.b64encode(
            urllib.urlopen(photo['image_url']).read()
        )
        
    return jsonify(data)

if __name__ == "__main__":
    app.run()
