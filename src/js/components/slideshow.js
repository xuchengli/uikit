import { util } from 'uikit';
import { Class } from '../mixin/index';

const {$, Transition} = util;

let Animations = {

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
                    Transition.start(slideshow.$next[0], {opacity:`${percent}`, duration}).then(() => {
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
        slideshow.$next.css({transform: `translateX(${dir * 100}%)`, zIndex:3});

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

UIkit.component('slideshow', {

    mixins: [Class],
    
    props: {
        height: String,
        animation: String,
        duration: Number,
        dragging: Boolean
    },

    defaults: {
        height: 'auto',
        animation: 'fade',
        dragging: true,
        duration: 350
    },

    connected() {

        this.current = 0;

        this.container = this.$el.find('.uk-slideshow-slides');
        this.slides = this.container.children();
        this.slides.eq(this.current).addClass('uk-active');
    },

    ready() {
    
    },

    events: [
        {
            name: 'click',
            handler(e) {
                e.preventDefault();
            }
        },

        {
            name: 'pointerdown',
            handler(e) {
                e.preventDefault();
                this.pointer = { x: e.clientX, y: e.clientY };
                this.lastpointer = { x: e.clientX, y: e.clientY };
            }
        },

        {
            name: 'pointermove',
            handler(e) {
                
                e.preventDefault();

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
            name: 'pointerup',
            handler(e) {
                e.preventDefault();

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
        }
    },

    update: {

            write() {
                this.resize();
            },

            events: ['load', 'resize', 'orientationchange']

        }

});
