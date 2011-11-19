/*
To use node.js or not?

Can simply use python and it'll process all the images but sockets make things cool and fast and awesome!

*/

var Image = Backbone.Model.extend({});

var ImageCollection = Backbone.Collection.extend({
    model: Image,
    url: "/get",

    // Return the next available image by the passed colour.
    getNextAvailableByColour: function(colour) {
        console.debug('getNextAvailableByColour', colour);
    }
});

window.Images = new ImageCollection;

var PianoApp = Backbone.View.extend({
    /*
    Initial:
        - Piano keys mapped to a colour spectrum. 
    */
    events: {
        "keypress": "onKeyboardPress"
    },

    initialize: function(_opts) {
        _.bindAll(this);
        // Array of dark colours of the spectrum. Can lower the hue for more images.
        this.colours = {
            purple: ['76024f'],
            red: ['9c0e1f']
        };

        this.map = {
            97: 'purple' // 'a'
        };

        // Get the default set of images as soon as possible.
        Images.fetch();
    },

    // Keyboard keys are mapped to colours. Homerow, baby!
    onKeyboardPress: function(ev) {
        console.debug('onKeyboardPress', ev);
        var colour = this.map[ev.which];

        this.fetchImage(colour);
    },

    // Fetch the image from the pre-processed collection and do something pretty with it.
    fetchImage: function(colour) {
        var image = Images.getNextAvailableByColour(colour);
    }


});
