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
            {name: 'pink', rgb: [190, 69, 170]},
            {name: 'greypink', rgb: [200, 130, 130]}
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
    events: {
        "keyup": "onKeyboardUp",
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
            display: "#display",
            bpm: "#bpm",
            beats: "#backgroundBeats",
            playSounds: "#playSounds"
        };

        // Homerow baby!
        this.keyMap = [
            {65: 'pinkred'}, // 'a'
            {83: 'red'},
            {68: 'orange'},
            {70: 'yellow'},
            {71: 'green'}, // 'g'
            {72: 'teal'},
            {74: 'skyblue'},
            {75: 'blue'},
            {76: 'purple'}, // 'l'
            {186: 'pink'}, // ';'
            {222: 'greypink'} // '
        ];

        this.keypressMap = [
            97, 115, 100, 102, 103, 104, 106, 107, 108, 59, 39
        ]

        this.colourIndex = _.map(this.keyMap, function(obj, index) {
            return _.values(obj)[0];
        });

        // Sound bytes are mapped to the index of keyMap
        this.soundMap = [];
        this.backgroundBeat;

        // Bootstrap the images as soon as possible.
        this.getImages();

        this.render();

        SC.whenStreamingReady(function() {
            self.setupSounds();
            self.backgroundBeats();

            // Once ready, anytime the bpm is changed let's refetch
            // some beats.
            $(self.selectors.bpm).mouseup(function() {
                // Don't pass the event object.
                self.setupSounds();
            });
        });
    },

    backgroundBeats: function(_opts) {
        var opts = _opts || {};
        var self = this;

        $(this.selectors.beats).change(function() {
            var id = $(self.selectors.beats).find(":selected").val();
            if (self.backgroundBeat) {
                self.backgroundBeat.stop();
            }
            self.backgroundBeat = SC.stream(id);
            // Background noise is quiet.
            self.backgroundBeat.setVolume(60);
            self.backgroundBeat.play();
        });

        _.extend(opts, {
            streamable: true
        });

        SC.get("/tracks", opts, function(tracks) {
            _.each(tracks, function(obj, index) {
                $(self.selectors.beats).append(
                    $("<option>").val(obj.id)
                        .html(obj.title.substring(0, 30))
                );
            });
        });
    },

    setupSounds: function(_opts) {
        var opts = _opts || {};
        var self = this;

        this.soundMap = [];

        _.extend(opts, {
            limit: _.size(this.keyMap),
            streamable: true,
            "duration[to]": 5000,
            "bpm[from]": $(this.selectors.bpm).val(),
            track_type: "loop",
            tag_list: "piano keyboard guitar"

        });

        console.log('setupSounds', opts);
        
        SC.get("/tracks", opts, function(tracks) {
            console.log(tracks);
            _.each(tracks, function(obj, index) {
                self.soundMap.push(SC.stream(obj.id));

                // Render each track on its respective keyboard.
                // TODO: this sucks.
                $(self.selectors.chords)
                    .find(":nth-child(" + (1 + index) + ")")
                    .html("<span>" + obj.duration + "</span>");
            });
        });

    },

    getImages: function(_opts) {
        var opts = _opts || {};
        console.debug('getImages', _opts);

        _.extend(opts, {
            success: this.onImageFetch
        });

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
        _.delay(function(currentPage) {
            self.getImages({
                data: {page: currentPage},
                add: true
            });
        }, 5000, currentPage);
    },

    // Key is being held
    onKeyboardPress: function(ev) {
        console.debug('onKeyboardPress', ev, ev.which);

        var colour = Images.baseColours[_.indexOf(this.keypressMap, ev.which)];

        $("#key-" + colour.name).css("opacity", "0.5");
    },

    // Key was released, do something funky.
    onKeyboardUp: function(ev) {
        console.debug('onKeyboardUp', ev, ev.which);

        var colour = _.find(this.keyMap, function(obj) {
            return _.keys(obj)[0] == ev.which;
        });


        if (!colour) {
            console.error("This keyboard key is not mapped.");
            return;
        }

        var colourName = _.values(colour)[0];

        $("#key-" + colourName).css("opacity", 1.0);

        // Play the soundMap file linked to the index of this key.
        if ($(this.selectors.playSounds).attr('checked')) {
            this.soundMap[_.indexOf(this.colourIndex, colourName)].play();
        }

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

            // This image should be removed from the collection as soon
            // as its used.
            Images.remove(image.get("id"));
            
            // Get the key to place this above.
            var $key = $("#key-" + colour);
            var start = $key.offset();

            console.log("top", start.top, "left", start.left);

            var $image = $("#img-" + image.get("id"));

            // Since the keyboard is no longer centered, images
            // should show up in a random space from the left,
            // but atleast away from the previous image.
            var leftStart = Images.getRandomInt(50, 700);

            $image.css({
                left: leftStart,
                top: (start.top - ($key.height() - 15))
            });
            $(this.selectors.display).append($image);

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
