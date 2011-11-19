from PIL import Image
import urllib
import cStringIO

"""
Given an image, the end result should the average colour (r,g,b) that the image is

Images are on the server, so they need to be curled in for detection.

To preserve the API sanity, the images could possibly be cached with their RGV values and a respective ID in an sqlite or couchdb
"""
class ImageProcess(object):
    def __init__(self, collection):
        self.collection = collection

    # Process the entire collection of photos passed
    def process(self):
        return [(photo, self.process_image(photo['image_url']))
                    for photo in self.collection]
        
    def process_image(self, image_url):
        print "process_image", image_url
        data = cStringIO.StringIO(urllib.urlopen(image_url).read())
        im = Image.open(data)
        colors = im.getcolors(256)

        print colors
        return "1"
