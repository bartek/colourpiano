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
            {name: 'pinkred', rgb: [255, 69, 68]},
            {name: 'red', rgb: [255, 40, 40]},
            {name: 'orange', rgb: [254, 131, 58]},
            {name: 'yellow', rgb: [240, 240, 60]},
            {name: 'green', rgb: [63, 179, 65]},
            {name: 'teal', rgb: [58, 193, 126]},
            {name: 'skyblue', rgb: [56, 222, 236]},
            {name: 'blue', rgb: [50, 90, 200]},
            {name: 'purple', rgb: [60, 28, 90]},
            {name: 'pink', rgb: [190, 69, 170]}
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
        var self = this;
        console.debug('PianoApp.initialize');
        _.bindAll(this);

        this.selectors = {
            chords: "#chords",
            chordSources: "#chordSources",
            categories: "#categories",
            graph: "#graph",
            display: "#display"
        };

        // Homerow baby!
        this.keyMap = [
            {97: 'pinkred'}, // 'a'
            {115: 'red'},
            {100: 'orange'},
            {102: 'yellow'},
            {103: 'green'}, // 'g'
            {104: 'teal'},
            {106: 'skyblue'},
            {107: 'blue'},
            {108: 'purple'}, // 'l'
            {59: 'pink'} // ';'
        ];

        // Chords are mapped by index to the keys. 
        this.chordMap = [
            "A", "A#''"
        ];

        // Bootstrap the images as soon as possible.
        this.getImages();

        this.render();
    },

    getImages: function(_opts) {
        console.debug('getImages', _opts);
        var opts = {
            success: this.onImageFetch
        }
        if (_opts) { _.extend(opts, _opts); }

        Images.fetch(opts);
    },

    onImageFetch: function(collection, response) {
        console.debug('onImageFetch', collection, response);
        var self = this;

        var nextPage = response.current_page + 1;
        // Adjust the currentPage to be ready to look for the next.
        var currentPage = nextPage <= response.total_pages ? nextPage : 1

        console.debug(currentPage);

        // Defer until all the fetch callstack is done (images being
        // added to the DOM) or we wont be able to reliably get the data.
        _.defer(function() {
            _.each(response.photos, function(obj, index) {
                Images.updateColourAttributes(obj.id);
            });

            // Reset the "keyboard"
            $(self.selectors.graph).html("");
            _.each(Images.pluck('hex'), function(hex) {
                var div = $("<div>").css("background-color", hex);
                $(self.selectors.graph).append(div);
            });
        });

        // Prepare to call the next round of image fetching.
        return;
        _.delay(function(currentPage) {
            self.getImages({
                data: {page: currentPage}
            });
        }, 5000, currentPage);
    },

    // Keyboard keys are mapped to colours. Homerow, baby!
    onKeyboardPress: function(ev) {
        console.debug('onKeyboardPress', ev, ev.which);
    
        var colour = _.find(this.keyMap, function(obj) {
            return _.keys(obj)[0] == ev.which;
        });

        var colourName = _.values(colour)[0];

        this.displayImage(colourName);
    },
    
    // User can play with different categories of images.
    onChangeCategory: function(ev) {
        console.debug('onChangeCategory', ev);
    
        var category = $(ev.currentTarget).find(':selected').text();
        var data = {
            'only': category
        };

        this.getImages({
            data: data,
            add: true
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
            var start = $key.offset();

            console.log("top", start.top, "left", start.left);
            console.log($key.width(), $key.height());

            var $image = $("#img-" + image.get("id"));

            // No time to figure out why we need to apply this on the left
            // but feel its due to the padding of each element.
            var errorOffset = 150; 
            $image.css({
                left: (start.left - errorOffset - $key.width()),
                top: (start.top - ($key.height() - 15))
            });
            $(this.selectors.display).append($image);

            // This image should be removed from the collection as soon
            // as its used.
            Images.remove(image.get("id"));

            // Image begins as hidden.
            $image.css("opacity", 0);


            $image.animate({
                top: '-=200',
                opacity: 1.0,
                height: 'linear'
            }, 3000, function() {
                $image.animate({
                    top: '-=200',
                    height: 'toggle',
                    width: 'toggle',
                    opacity: 0
                }, 3000, function() {
                    $image.detach();
                });
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

        _.each(this.keyMap, function(keyObj, index) {
            var value = _.values(keyObj)[0];
            var colour = _.find(Images.baseColours, function(obj) {
                return obj.name === value;
            });
            var hex = Images.rgbToHex(colour.rgb[0], colour.rgb[1], colour.rgb[2]);
            $(self.selectors.chords).append(
                $("<div>").attr("id", "key-" + value).html(value)
                    .css("background-color", "#" + hex)
            );
        });
    }
});
