import unittest

from fivehundred import FiveHundredApi
from colours import ImageProcess
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

    def test_processing(self):
        images = self.fivehundred.photos('upcoming')

        process = ImageProcess(images['photos']).process()

        print process

if __name__ == "__main__":
    unittest.main()
