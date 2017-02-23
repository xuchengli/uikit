import { util } from 'uikit';
import { Class } from '../mixin/index';

const { $, Transition, pointerDown, pointerMove, pointerUp } = util;

let Animations;
let playerId = 0;

UIkit.component('slideshow', {

    mixins: [Class],

    props: {
        height: String,
        animation: String,
        duration: Number,
        dragging: Boolean,
        autoplay: Number
    },

    defaults: {
        height: 'auto',
        animation: 'fade',
        dragging: true,
        duration: 350,
        autoplay: 0
    },

    connected() {

        this.current = 0;

        this.container = this.$el.find('.uk-slideshow-slides');
        this.init();

        if (!this.slides.eq(this.current).length) {
           this.current = 0;
        }

        this.slides.eq(this.current).addClass('uk-active');

        if (this.autoplay) {
            this.start();
        }
    },

    ready() {

    },

    events: [

        {
            name: 'mouseenter',
            handler(e) { this.isHovering = true; }
        },

        {
            name: 'mouseleave',
            handler(e) { this.isHovering = false; }
        },

        {
            name: pointerDown,
            handler(e) {

                e = normalizeEvevent(e);

                this.pointer = { x: e.clientX, y: e.clientY };
                this.lastpointer = { x: e.clientX, y: e.clientY };
            }
        },

        {
            name: pointerMove,
            handler(e) {

                e = normalizeEvevent(e);

                if (!this.pointer) {
                    return;
                }

                this.lastpointer = { x: e.clientX, y: e.clientY, dir: this.lastpointer.x > e.clientX ? 1:-1 };

                let diff = (this.pointer.x - e.clientX) / this.$el.width();

                if (!this.$animation) {

                    if (this.lastpointer.dir == -1) {
                        this.show(this.current - 1 < 0 ? this.slides.length-1:this.current - 1, 0, -1);
                    } else {
                        this.show(this.current + 1 == this.slides.length ? 0:this.current + 1, 0, 1);
                    }
                }

                if (diff * this.$animation.dir < 0) {

                    this.$animation.finish(true);

                    if (this.lastpointer.dir == -1) {
                        this.show(this.current - 1 < 0 ? this.slides.length-1:this.current - 1, 0, -1);
                    } else {
                        this.show(this.current + 1 == this.slides.length ? 0:this.current + 1, 0, 1);
                    }
                }

                this.$animation.update(Math.abs(diff));
                this.dragged = true;
            }
        },

        {
            name: pointerUp,
            handler(e) {

                e = normalizeEvevent(e);

                if (this.$animation) {

                    if (this.dragged && this.$animation.dir != this.lastpointer.dir) {
                         this.$animation.update(0, true);
                    } else {
                        this.$animation.update(1);
                    }

                } else {
                    //this.next();
                }

                this.pointer = null;
                this.lastpointer = null;
                this.dragged = false;
            }
        }
    ],

    methods: {

        init() {

            let $self = this, canvas, type, slide, media, placeholder;

            this.slides = this.container.children();

            this.slides.each(function(index) {

                slide = $(this);
                placeholder = false;
                type = 'html';

                if (slide.data('type')) {
                    return;
                }

                let media = slide.children('img,video,iframe').eq(0);

                slide.data('media', media);

                if (media.length) {

                    type = media[0].nodeName.toLowerCase();

                    switch(type) {

                        case 'img':

                            slide.addClass('uk-cover-background').css({backgroundImage: `url(${media.attr('src')})`});
                            media.addClass('uk-width-1-1 uk-invisible');

                            if (media.attr('width') && media.attr('height')) {
                                media.replaceWith(`<canvas class="uk-width-1-1" width="${media[0].width}" height="${media[0].height}"></canvas>`);
                                media = canvas;
                            }

                            break;

                       case 'iframe':

                            var src = media[0].src, iframeId = `uk-slideshow-${++playerId}`;

                            placeholder = true;

                            media.attr('src', '').on('load', function(){

                                   if (index !== $self.current || (index == $self.current && !$self.videoautoplay)) {
                                       $self.pausemedia(media);
                                   }

                                   if ($self.videomute) {

                                       $self.mutemedia(media);

                                       var inv = setInterval((function(ic) {
                                           return function() {
                                               $self.mutemedia(media);
                                               if (++ic >= 4) clearInterval(inv);
                                           }
                                       })(0), 250);
                                   }

                               })
                               .css('pointer-events', 'none')
                               .data('slideshow', $self)  // add self-reference for the vimeo-ready listener
                               .attr('data-player-id', iframeId)  // add frameId for the vimeo-ready listener
                               .attr('src', [src, (src.indexOf('?') > -1 ? '&':'?'), 'autoplay=1&amp;controls=0&amp;showinfo=0&amp;rel=0&amp;loop=1&amp;modestbranding=1&amp;wmode=transparent&amp;enablejsapi=1&amp;api=1&amp;player_id='+iframeId].join(''))
                               .addClass('uk-position-absolute uk-cover');
                           break;

                       case 'video':

                           media.addClass('uk-position-absolute');
                           placeholder = true;

                           if ($self.videomute)  {
                               $self.mutemedia(media);
                           }
                   }

                   if (placeholder) {
                       slide.prepend(`<canvas class="uk-width-1-1" width="${media[0].width}" height="${media[0].height}"></canvas>`);
                   }

               }

               slide.data('type', type);
            });
        },

        resize() {

            if (this.$el.hasClass('uk-slideshow-fullscreen')) {
                return;
            }

            var height = this.height;

            if (this.height === 'auto') {

                height = 0;

                this.slides.css('height', '').each(function() {
                    height = Math.max(height, $(this).height());
                });
            }

            this.container.css('height', height);
            this.slides.css('height', height)
        },

        show(index, percent, dir) {

            if (this.$animation) {
                this.$animation.finish();
            }

            dir = dir || (index < this.current ? -1 : 1);

            this.$current = this.slides.eq(this.current).addClass('uk-inprogress');
            this.$next = this.slides.eq(index).addClass('uk-next uk-inprogress');
            this.$animation = Animations[this.animation](this, dir);
            this.$animationEnd = (revert) => {

                this.$animation = null;
                this.slides.removeClass('uk-active uk-next uk-inprogress')

                if (revert) {
                    this.$current.addClass('uk-active');
                } else {
                    this.$next.addClass('uk-active');
                    this.current = index;
                }
            };

            this.$animation.dir = dir;
            this.$animation.update(percent);
        },

        next() {
            this.show(this.slides.eq(this.current + 1).length ? this.current + 1 : 0);
        },

        previous() {
            this.show(this.slides.eq(this.current - 1).length ? this.current + 1 : this.slides.length - 1);
        },

        start() {

            this.stop();

            this.interval = setInterval(() => {
                if (!this.isHovering) this.next();
            }, this.autoplay);

        },

        stop() {
            if (this.interval) clearInterval(this.interval);
        },

        playmedia: function(media) {

            if (!(media && media[0])) return;

            switch(media[0].nodeName) {
                case 'VIDEO':

                    if (!this.videomute) {
                        media[0].muted = false;
                    }

                    media[0].play();
                    break;
                case 'IFRAME':

                    if (!this.videomute) {
                        media[0].contentWindow.postMessage('{ "event": "command", "func": "unmute", "method":"setVolume", "value":1}', '*');
                    }

                    media[0].contentWindow.postMessage('{ "event": "command", "func": "playVideo", "method":"play"}', '*');
                    break;
            }
        },

        pausemedia: function(media) {

            switch(media[0].nodeName) {
                case 'VIDEO':
                    media[0].pause();
                    break;
                case 'IFRAME':
                    media[0].contentWindow.postMessage('{ "event": "command", "func": "pauseVideo", "method":"pause"}', '*');
                    break;
            }
        },

        mutemedia: function(media) {

            switch(media[0].nodeName) {
                case 'VIDEO':
                    media[0].muted = true;
                    break;
                case 'IFRAME':
                    media[0].contentWindow.postMessage('{ "event": "command", "func": "mute", "method":"setVolume", "value":0}', '*');
                    break;
            }
        }
    },

    update: {

            write() {
                this.resize();
            },

            events: ['load', 'resize', 'orientationchange']

        }

});


function normalizeEvevent(event) {
    return event.originalEvent.touches ? event.originalEvent.touches[0] : event.originalEvent;
}


Animations = {

    slide: (slideshow, dir) => {

        slideshow.$current.css('transform', 'translateX(0)');
        slideshow.$next.css('transform', `translateX(${dir * 100}%)`);

        let progress = 0;
        let animation = {

            finish: (revert) => {
                Transition.stop(slideshow.$current[0]);
                Transition.stop(slideshow.$next[0]);
                slideshow.$current.css({transform: ''});
                slideshow.$next.css({transform: ''});
                slideshow.$animationEnd(revert);
            },

            update: (percent, revert) => {

                percent = parseFloat(percent == undefined ? 1 : percent);

                if (percent < 1 && !revert) {
                    slideshow.$current.css({transform:`translateX(${percent * -100 * dir}%)`});
                    slideshow.$next.css({transform:`translateX(${(1-percent) * 100 * dir}%)`});
                } else {

                    let duration = slideshow.duration * (revert ? progress : (1-progress));

                    Transition.start(slideshow.$current[0], {transform:`translateX(${percent * -100 * dir}%)`}, duration);
                    Transition.start(slideshow.$next[0], {transform:`translateX(${(1-percent) * 100 * dir}%)`}, duration).then(() => {
                        animation.finish(revert);
                    });
                }

                progress = percent;
            }
        };

        return animation;
    },

    fade: (slideshow, dir) => {

        slideshow.$current.css('opacity', '1');
        slideshow.$next.css('opacity', '0');

        let progress = 0;
        let animation = {

            finish: (revert) => {
                Transition.stop(slideshow.$current[0]);
                Transition.stop(slideshow.$next[0]);
                slideshow.$current.css('opacity', '');
                slideshow.$next.css('opacity', '');
                slideshow.$animationEnd(revert);
            },

            update: (percent, revert) => {

                percent = parseFloat(percent == undefined ? 1 : percent);

                if (percent < 1 && !revert) {
                    slideshow.$current.css({opacity:`${1-percent}`});
                    slideshow.$next.css({opacity:`${percent}`});
                } else {

                    let duration = slideshow.duration * (revert ? progress : (1-progress));

                    Transition.start(slideshow.$current[0], {opacity:`${1-percent}`, duration});
                    Transition.start(slideshow.$next[0], {opacity:`${percent}`}, duration).then(() => {
                        animation.finish(revert);
                    });
                }

                progress = percent;
            }
        };

        return animation;
    },

    scale: (slideshow, dir) => {

        let progress = 0;
        let animation = {

            finish: (revert) => {
                Transition.stop(slideshow.$current[0]);
                slideshow.$current.css({transform: '', 'opacity': ''});
                slideshow.$animationEnd(revert);
            },

            update: (percent, revert) => {

                percent = parseFloat(percent == undefined ? 1 : percent);

                if (percent < 1 && !revert) {
                    slideshow.$current.css({opacity:`${1-percent}`, transform: `scale(${1+percent})`});
                } else {

                    let duration = slideshow.duration * (revert ? progress : (1-progress));

                    Transition.start(slideshow.$current[0], {opacity:`${1-percent}`, transform: `scale(${revert ? 1:2})`}, duration).then(() => {
                        animation.finish(revert);
                    });
                }

                progress = percent;
            }
        };

        return animation;
    },

    swipe: (slideshow, dir) => {

        slideshow.$current.css('transform', 'translateX(0) scale(0)');
        slideshow.$next.css({transform: `translateX(${dir * 100}%) scale(1.0)`, zIndex:3});

        let progress = 0;
        let animation = {

            finish: (revert) => {
                Transition.stop(slideshow.$current[0]);
                Transition.stop(slideshow.$next[0]);
                slideshow.$current.css('transform', '');
                slideshow.$next.css({transform: '', zIndex:''});
                slideshow.$animationEnd(revert);
            },

            update: (percent, revert) => {

                percent = parseFloat(percent == undefined ? 1 : percent);

                if (percent < 1 && !revert) {
                    slideshow.$current.css({transform:`translateX(${(.4 * percent) * -100 * dir}%) scale(${1-(.2*percent)})`});
                    slideshow.$next.css({transform:`translateX(${(1-percent) * 100 * dir}%)`});
                } else {

                    let duration = slideshow.duration * (revert ? progress : (1-progress));

                    Transition.start(slideshow.$current[0], {transform:`translateX(${(.4 * percent) * -100 * dir}%) scale(${revert ? 1:.8})`}, duration);
                    Transition.start(slideshow.$next[0], {transform:`translateX(${(1-percent) * 100 * dir}%)`}, duration).then(() => {
                        animation.finish(revert);
                    });
                }

                progress = percent;
            }
        };

        return animation;
    }

}

// Listen for messages from the vimeo player
window.addEventListener('message', e => {

    let data = e.data, iframe;

    if (typeof(data) == 'string') {

        try {
            data = JSON.parse(data);
        } catch(err) {
            data = {};
        }
    }

    if (e.origin && e.origin.indexOf('vimeo') > -1 && data.event == 'ready' && data.player_id) {
        iframe = UI.$(`[data-player-id='${data.player_id}']`);

        if (iframe.length) {
            iframe.data('slideshow').mutemedia(iframe);
        }
    }
}, false);
