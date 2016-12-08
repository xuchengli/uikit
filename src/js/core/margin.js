import { $ } from '../util/index';

export default function (UIkit) {

    UIkit.component('margin', {

        props: {
            firstRow: String,
            firstColumn: String
        },

        defaults: {
            firstRow: 'uk-first-row',
            firstColumn: 'uk-first-column'
        },

        update: {

            handler() {

                if (this.$el[0].offsetHeight === 0) {
                    return;
                }

                var children = this.$el.children();

                if (!children.length) {
                    return;
                }

                this.$el.css('marginTop', '');

                var parent = parseFloat(this.$el.css('marginTop')),
                    child =  parseFloat(children.eq(0).css('marginTop')),
                    prev = this.$el.prev();

                while (prev.length && ['absolute', 'fixed'].indexOf(prev.css('position')) !== -1) {
                    prev = prev.prev();
                }

                if (parent + child && !prev.hasClass('uk-'+this.$options.name)) {

                    var margin = parent - child;

                    if (prev.length) {
                        prev = parseFloat(this.$el.prev().css('marginBottom'));

                        if (parent <= prev && (margin >= 0 && margin < prev || child >= prev)) {
                            margin = -child;
                        }
                    }

                    this.$el.attr('style', `${this.$el.attr('style') || ''};margin-top: ${margin}px !important;`);
                }

                this.stacks = true;

                var columns = children
                        .filter((_, el) => el.offsetHeight > 0)
                        .removeClass(this.firstRow)
                        .removeClass(this.firstColumn),
                    rows = [[columns.get(0)]];

                columns.slice(1).each((_, el) => {

                    var top = Math.ceil(el.offsetTop), bottom = top + el.offsetHeight;

                    for (var index = rows.length - 1; index >= 0; index--) {
                        var row = rows[index], rowTop = Math.ceil(row[0].offsetTop);

                        if (top >= rowTop + row[0].offsetHeight) {
                            rows.push([el]);
                            break;
                        }

                        if (bottom > rowTop) {

                            this.stacks = false;

                            if (el.offsetLeft < row[0].offsetLeft) {
                                row.unshift(el);
                                break;
                            }

                            row.push(el);
                            break;
                        }

                        if (index === 0) {
                            rows.splice(index, 0, [el]);
                            break;
                        }

                    }

                });

                rows.forEach((row, i) =>
                    row.forEach((el, j) =>
                        $(el)
                            .toggleClass(this.firstRow, i === 0)
                            .toggleClass(this.firstColumn, j === 0)
                    )
                );

            },

            events: ['load', 'resize', 'orientationchange']

        }

    });

}
