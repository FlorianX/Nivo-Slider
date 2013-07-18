/*
 *
 * jQuery Nivo Slider KIS 1.0
 * https://github.com/FlorianX/Nivo-Slider
 *
 * Forked from: jQuery Nivo Slider v3.2
 * http://nivo.dev7studios.com
 *
 * Copyright 2012, Dev7studios
 * Free to use and abuse under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 */

(function($) {
    var NivoSlider = function(element, options){
        // Defaults are below
        var settings = $.extend({}, $.fn.nivoSlider.defaults, options);

        // Useful variables. Play carefully.
        var vars = {
            currentSlide: 0,
            nextSlide: 1,
            currentEntry: '',
            nextEntry: '',
            totalSlides: 0,
            running: false,
            paused: false,
            stop: false,
            controlNavEl: false
        };

        // Get this slider
        var slider = $(element);
        slider.data('nivo:vars', vars).addClass('nivoSlider');

        // Find our slider children
        var kids = slider.children('div.nivoSliderEntry');
        vars.totalSlides = kids.length;

        // Set startSlide
        if(settings.startSlide > 0){
            if(settings.startSlide >= vars.totalSlides) { settings.startSlide = vars.totalSlides - 1; }
            vars.currentSlide = settings.startSlide;
        }

        var processSliderDimension = function(forEntry) {
            // Get img height
            var img = $('img:first',forEntry),
                imgHeight = (imgHeight === 0) ? img.attr('height') : img.height(),
                imgWidth = (imgWidth === 0) ? img.attr('width') : img.width();

            slider.css({
                height: imgHeight,
                width:imgWidth
            });
            forEntry.css({
                height: imgHeight,
                width:imgWidth
            });

        };
        // Show initial entry
        if($(kids[vars.currentSlide])){
            vars.currentEntry = $(kids[vars.currentSlide]);
            vars.currentEntry.show();

            vars.currentEntry.css({
                'z-index': 6,
                'opacity': 1
            });

            processSliderDimension(vars.currentEntry);
        }

        // In the words of Super Mario "let's a go!"
        var timer = 0;
        if(!settings.manualAdvance && kids.length > 1){
            timer = setInterval(function(){ nivoRun(slider, kids, settings, false); }, settings.pauseTime);
        }

        // Add Direction nav
        if(settings.directionNav){
            slider.append('<div class="nivo-directionNav"><a class="nivo-prevNav">'+ settings.prevText +'</a><a class="nivo-nextNav">'+ settings.nextText +'</a></div>');

            $(slider).on('click', 'a.nivo-prevNav', function(){
                if(vars.running) { return false; }
                clearInterval(timer);
                timer = '';

                vars.nextSlide -= 2;

                nivoRun(slider, kids, settings, 'prev');
            });

            $(slider).on('click', 'a.nivo-nextNav', function(){
                if(vars.running) { return false; }
                clearInterval(timer);
                timer = '';
                nivoRun(slider, kids, settings, 'next');
            });
        }

        // Add Control nav
        if(settings.controlNav){
            vars.controlNavEl = $('<div class="nivo-controlNav"></div>');
            slider.after(vars.controlNavEl);
            for(var i = 0; i < kids.length; i++){
                vars.controlNavEl.append('<a class="nivo-control" rel="'+ i +'">'+ (i + 1) +'</a>');
            }

            //Set initial active link
            $('a:eq('+ vars.currentSlide +')', vars.controlNavEl).addClass('active');

            $('a', vars.controlNavEl).bind('click', function(){
                if(vars.running) return false;
                if($(this).hasClass('active')) return false;
                clearInterval(timer);
                timer = '';

                vars.nextSlide = $(this).attr('rel');
                nivoRun(slider, kids, settings, 'control');
            });
        }

        //For pauseOnHover setting
        if(settings.pauseOnHover){
            slider.hover(function(){
                vars.paused = true;
                clearInterval(timer);
                timer = '';
            }, function(){
                vars.paused = false;
                // Restart the timer
                if(timer === '' && !settings.manualAdvance){
                    timer = setInterval(function(){ nivoRun(slider, kids, settings, false); }, settings.pauseTime);
                }
            });
        }

        // Event when Animation finishes
        slider.bind('nivo:animFinished', function(){
            vars.running = false;

            // Restart the timer
            if(timer === '' && !vars.paused && !settings.manualAdvance){
                timer = setInterval(function(){ nivoRun(slider, kids, settings, false); }, settings.pauseTime);
            }
            // Trigger the afterChange callback
            settings.afterChange.call(this);
        });

        // Private run method
        var nivoRun = function(slider, kids, settings, nudge){
            // Get our vars
            var vars = slider.data('nivo:vars');

            // Trigger the lastSlide callback
            if(vars && (vars.nextSlide === vars.totalSlides)){
                settings.lastSlide.call(this);
            }

            // Stop
            if((!vars || vars.stop) && !nudge) { return false; }

            // Trigger the beforeChange callback
            settings.beforeChange.call(this);

            if(vars.nextSlide < 0) { vars.nextSlide = (vars.totalSlides - 1);  }

            // Trigger the slideshowEnd callback
            if(vars.nextSlide === vars.totalSlides && (nudge !== 'prev')){
                vars.nextSlide = 0;
                settings.slideshowEnd.call(this);
            }

            // Set vars.currentEntry
            if($(kids[vars.currentSlide])){
                vars.currentEntry = $(kids[vars.currentSlide]);
            }
            // Set vars.nextEntry
            if($(kids[vars.nextSlide])){
                vars.nextEntry = $(kids[vars.nextSlide]);
            }

            // Set active links
            if(settings.controlNav){
                $('a', vars.controlNavEl).removeClass('active');
                $('a:eq('+ vars.nextSlide +')', vars.controlNavEl).addClass('active');
            }

            var currentEffect = settings.effect;

            // Run effects
            vars.running = true;
            if(currentEffect === 'fade'){
                vars.nextEntry.show();

                processSliderDimension(vars.nextEntry);

                vars.currentEntry.animate({
                    'opacity': 0.0,
                    'z-index': 5
                    }, {
                        'duration': (settings.animSpeed*2),
                        'queue': false,
                        'complete': function(){
                            $(this).css({
                               'z-index': '',
                               'opacity': ''
                            }).hide();
                        }
                    });
                vars.nextEntry.animate({
                    'opacity': 1.0,
                    'z-index': 6
                    }, {
                        'duration': (settings.animSpeed*2),
                        'queue': false,
                        'complete': function(){
                            slider.trigger('nivo:animFinished');
                        }
                    });
            }

            vars.currentSlide = vars.nextSlide;
            vars.nextSlide++;
        };

        // For debugging
        var trace = function(msg){
            if(this.console && typeof console.log !== 'undefined') { console.log(msg); }
        };

        // Start / Stop
        this.stop = function(){
            if(!$(element).data('nivo:vars').stop){
                $(element).data('nivo:vars').stop = true;
                trace('Stop Slider');
            }
        };

        this.start = function(){
            if($(element).data('nivo:vars').stop){
                $(element).data('nivo:vars').stop = false;
                trace('Start Slider');
            }
        };

        // Trigger the afterLoad callback
        settings.afterLoad.call(this);

        return this;
    };

    $.fn.nivoSlider = function(options) {
        return this.each(function(key, value){
            var element = $(this);
            // Return early if this element already has a plugin instance
            if (element.data('nivoslider')) { return element.data('nivoslider'); }
            // Pass options to plugin constructor
            var nivoslider = new NivoSlider(this, options);
            // Store plugin object in this element's data
            element.data('nivoslider', nivoslider);
        });
    };

    //Default settings
    $.fn.nivoSlider.defaults = {
        effect: 'fade',
        animSpeed: 500,
        pauseTime: 7000,
        startSlide: 0,
        directionNav: true,
        controlNav: true,
        pauseOnHover: true,
        manualAdvance: false,
        prevText: 'Prev',
        nextText: 'Next',
        beforeChange: function(){},
        afterChange: function(){},
        slideshowEnd: function(){},
        lastSlide: function(){},
        afterLoad: function(){}
    };

    $.fn._reverse = [].reverse;

})(jQuery);