import unittest

from fivehundred import FiveHundredApi
from settings import CONSUMER_KEY, CONSUMER_SECRET

class FiveHundredTestCase(unittest.TestCase):
    def setUp(self):
        self.fivehundred = FiveHundredApi(
            consumer_key=CONSUMER_KEY,
            consumer_secret=CONSUMER_SECRET,
        )

    def test_get_images(self):
        images = self.fivehundred.photos('popular', **{})

        self.assertTrue(images['photos'])

    def test_get_images_with_options(self):
        kwargs = {
            'only': 'Abstract',
        }
        images = self.fivehundred.photos('upcoming', **kwargs)

        print images
            

if __name__ == "__main__":
    unittest.main()
