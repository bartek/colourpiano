// Apparently these aren't on the API anywhere.
window.Categories = [
    [10, 'Abstract'],
    [11, 'Animals'],
    [5, 'Black and White'],
    [1, 'Celebrities'],
    [9, 'City and Architecture'],
    [15, 'Commercial']
];

var ImageModel = Backbone.Model.extend({ });
var ImageCollection = Backbone.Collection.extend({
    model: ImageModel,
    url: "/photos/upcoming",

    baseColours: [
            {name: 'grey', rgb: [128, 128, 128]}, // A lot of grey in 500px!
            {name: 'brown', rgb: [150, 75, 0]},
            {name: 'purple', rgb: [128, 0, 128]},
            {name: 'blue', rgb: [0, 0, 255]},
            {name: 'green', rgb: [0, 255, 0]},
            {name: 'naturegreen', rgb: [99, 116, 45]},
            {name: 'yellow', rgb: [255, 255, 0]},
            {name: 'orange', rgb: [255, 165, 0]},
            {name: 'red', rgb: [255, 0, 0]},
            {name: 'pink', rgb: [218, 121, 160]}
    ],

    parse: function(response) {
        // Create the images in the DOM as soon as possible.
        _.each(response.photos, function(obj, index) {
            var base64_string = "data:image/jpeg;base64," + obj.image_encoded;
            var $image = $("<img>", {
                src: base64_string
            });
            $image.attr("id", "img-" + obj.id);
            $("#images").append($image);
        });
        return response.photos;
    },

    // Hack the crap out of the model to get the colour.
    _add: function(model, options) {
        var prepared_model = Backbone.Collection.prototype._add.apply(this, [model, options]);
        return prepared_model;
    },

    rgbToHsv: function(r, g, b) {
        var min = Math.min(r, g, b),
            max = Math.max(r, g, b),
            delta = max - min,
            h, s, v = max;

        v = Math.floor(max / 255 * 100);
        if ( max != 0 )
            s = Math.floor(delta / max * 100);
        else {
            // black
            return [0, 0, 0];
        }

        if( r == max )
            h = ( g - b ) / delta;         // between yellow & magenta
        else if( g == max )
            h = 2 + ( b - r ) / delta;     // between cyan & yellow
        else
            h = 4 + ( r - g ) / delta;     // between magenta & cyan

        h = Math.floor(h * 60);            // degrees
        if( h < 0 ) h += 360;

        return [h, s, v];
    },

    rgbToHex: function(r, g, b) {
       return this.toHex(r) + this.toHex(g) + this.toHex(b); 
    },

    toHex: function(value) {
        var value = parseInt(value, 10);
        if (isNaN(value)) {
            return "00";
        }
        value = Math.max(0, Math.min(value, 255));
        return "0123456789ABCDEF".charAt((value-value%16)/16)
              + "0123456789ABCDEF".charAt(value%16);
    },

    getRandomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Return the next available image by the passed colour.
    getNextAvailableByColour: function(colour) {
        console.debug('getNextAvailableByColour', colour);
        var coloured = this.filter(function(image) {
            return image.get("colourName") === colour
        });
        return coloured[this.getRandomInt(0, _.size(coloured) - 1)];
    },

    updateColourAttributes: function(id) {
        var canvas = document.getElementById("picCanvas");
        var context = canvas.getContext('2d');

        var prepared_model = this.get(id);
        var $image = $("#img-" + prepared_model.get("id"));

        var imageObj = new Image();
        imageObj.src = $image.attr("src");
        context.drawImage(imageObj, 0, 0);
        var sourceHeight = $image.height();
        var sourceWidth = $image.width();

        if (sourceWidth === 0 && sourceHeight === 0) {
            console.error("Could not detect image width or height");
            return prepared_model;
        }
        
        var imageData = context.getImageData(0, 0, sourceWidth, sourceHeight);
        var data = imageData.data;

        var red = 0, green = 0, blue = 0, count = 0;
        for (var y = 0; y < sourceHeight; y++) {
            for (var x = 0; x < sourceWidth; x++) {
                count += 1;
                red += data[((sourceWidth * y) + x) * 4];
                green += data[((sourceWidth * y) + x) * 4 +1];
                blue += data[((sourceWidth * y) + x) * 4 + 2];
            }
        }

        // Finally, calculate the averages.
        red = parseInt(red / count, 0);
        green = parseInt(green / count, 0);
        blue = parseInt(blue / count, 0);
    
        
        // Loop through the baseColours and figure out which base colour
        // this image is closest to.
        var baseColours = _.extend(this.baseColours);

        var closestColour = _.sortBy(baseColours, function(colour) {
            return (
                 Math.pow(red - colour.rgb[0], 2) + 
                 Math.pow(green - colour.rgb[1], 2) + 
                 Math.pow(blue - colour.rgb[2], 2)
            );
        });

        // Given the sorted list of closest colours, the first one should be the
        // most optimal colour for this instance.
        prepared_model.set({colourName: closestColour[0].name});

        // Hey, let's get the Chroma! How colourful the image is.
        var imgChroma = _.max([red, green, blue]) - _.min([red, green, blue]);
        prepared_model.set({chroma: imgChroma});

        // Save the converted hex value. We can use this!
        prepared_model.set({hex: this.rgbToHex(red, green, blue)});
    }
});

window.Images = new ImageCollection;

var PianoApp = Backbone.View.extend({
    /*
    Initial:
        - Piano keys mapped to a colour spectrum. 
    */
    events: {
        "keypress": "onKeyboardPress",
        "change #categories": "onChangeCategory"
    },

    initialize: function(_opts) {
        console.debug('PianoApp.initialize');
        _.bindAll(this);
        // Array of dark colours of the spectrum. Can lower the hue for more images.
        this.selectors = {
            chords: "#chords",
            categories: "#categories",
            graph: "#graph",
            display: "#display"
        };

        // Homerow baby!
        this.keyMap = {
            97: 'grey', // 'a'
            115: 'brown',
            100: 'purple',
            102: 'green',
            103: 'naturegreen', // 'g'
            104: 'yellow',
            106: 'orange',
            107: 'red',
            108: 'pink' // 'l'
        };

        // Bootstrap the images as soon as possible.
        Images.fetch({
            success: this.onImageFetch
        });

        this.render();
    },

    onImageFetch: function(collection, response) {
        console.debug('onImageFetch', collection, response);
        var self = this;

        // Defer until all the images are done being added to the DOM, or we 
        // wont be able to reliably get the data here.
        _.defer(function() {
            _.each(response.photos, function(obj, index) {
                Images.updateColourAttributes(obj.id);
            });

            // Reset the "keyboard"
            $(self.selectors.graph).html("");
            _.each(Images.pluck('hex'), function(hex) {
                var div = $("<div>", {
                    style: "width: 20px; height: 20px; background-color: " + hex
                });
                $(self.selectors.graph).append(div);
            });
        });
    },

    // Keyboard keys are mapped to colours. Homerow, baby!
    onKeyboardPress: function(ev) {
        console.debug('onKeyboardPress', ev, ev.which);
        var colour = this.keyMap[ev.which];

        this.displayImage(colour);
    },
    
    onChangeCategory: function(ev) {
        console.debug('onChangeCategory', ev);
    
        var category = $(ev.currentTarget).find(':selected').text();
        var data = {
            'only': category
        };

        Images.fetch({
            data: data,
            add: true,
            success: this.onImageFetch
        });
    },

    // Fetch the image from the pre-processed collection and do something 
    // pretty with it.
    displayImage: function(colour) {
        var image = Images.getNextAvailableByColour(colour);
        
        // Append the image and float if above this "key"
        if (image) {
            console.debug("Found image", image);
            
            // Get the key to place this above.
            var $key = $("#key-" + colour);
            console.log($key.offset());
            console.log($key.width());
            var start = $key.offset();

            var $image = $("#img-" + image.get("id"));
            $image.css({
                left: (start.left - $key.width()),
                top: (start.top - 150)
            });
            $(this.selectors.display).append($image);

            // Now animate it!
            $image.animate({
                top: '-=200',
                opacity: 0.25,
                height: 'linear'
            }, 5000, function() {
                // If the image is detached, it should also be removed destroyed
                // from the collection.
                $image.detach();
                Images.remove(image.get("id"));
            });
        } else {
            console.error("No images found for", colour);
        }
    },

    // Draw the keys!
    render: function() {
        var self = this;
        _.each(window.Categories, function(obj, index) {
            $(self.selectors.categories).append(
                $("<option />").val(obj[0]).html(obj[1])
            );
        });

        _.each(this.keyMap, function(value, key) {
            var colour = _.find(Images.baseColours, function(obj) {
                return obj.name === value;
            });
            var hex = Images.rgbToHex(colour.rgb[0], colour.rgb[1], colour.rgb[2]);
            $(self.selectors.chords).append(
                $("<span>").attr("id", "key-" + value).html(value)
                    .css("background-color", hex)
            );
        });
    }
});
