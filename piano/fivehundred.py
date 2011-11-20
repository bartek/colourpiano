import logging

import json
import requests
from oauth_hook.hook import OAuthHook

logger = logging.getLogger(__name__)

class FiveHundredApi(object):
    def __init__(self, access_token=None, access_token_secret=None,
                    consumer_key=None, consumer_secret=None,
                    debug=False):

        logger.debug("Init 500Api %s %s" % (consumer_key, consumer_secret))
        self.oauth_hook = OAuthHook(
            consumer_key=consumer_key,
            consumer_secret=consumer_secret,
        )
        self.client = requests.session(hooks={'pre_request': self.oauth_hook})
        self.base_uri = 'https://api.500px.com/v1'
        self.debug = debug

    def photos(self, feature, **kwargs):
        # Cheap hack: If debug is on, simply return the photo fixture
        if self.debug:
            return json.loads(open('fixtures/photos.json').read())

        query = ['%s/photos' % self.base_uri]

        query.append('?feature=%s' % feature)

        for k, v in kwargs.items():
            query.append('&%s=%s' % (k, v))

        response = self.client.get(''.join(query))
        return json.loads(response.content)
