

var Core = Core || {

    init: function() {
        if ($(document).foundation) {
            $(document).foundation({
                "magellan-expedition": {
                    active_class : 'active',
                    threshold : 0,
                    destination_threshold : 20,
                    throttle_delay : 30,
                    fixed_top : 0,
                    offset_by_height : false,
                    duration : 150,
                    easing : 'swing'
                }
            });
        }

        this.cloneSideMenuToOffCanvas();
        this.demoForm();
        this.resizeIframes();
        this.lastHeight = $(document).height();

        this.onResize();
        this.onScroll();
        this.checkChanges();
        this.handleEvents();
    },

    handleEvents: function() {
        var _this = this;
        var resizeTimer, scrollTimer;

        $(window).resize(function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() { _this.onResize(); }, 50);
        });
        $(window).scroll(function() {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(function() { _this.onScroll(); }, 50);
        });
    },

    // Check if document height changed
    checkChanges: function() {
        var _this = this;
        var newHeight = $(document).height();
        if (newHeight != this.lastHeight) {
            this.lastHeight = newHeight;
            this.onResize();
        }
        setTimeout(function() { _this.checkChanges() }, 500);
    },

    moveFooter: function() {
        var footer = $(".footer");
        if ($(document).height() <= $(window).height()) {
            footer.css({bottom: 0});
        } else {
            footer.removeAttr("style");
        }
    },

    isElementVisible: function(elementToBeChecked) {
        var TopView = $(window).scrollTop();
        var BotView = TopView + $(window).height();
        if ($(elementToBeChecked).offset() != undefined) {
            var TopElement = $(elementToBeChecked).offset().top;
            var BotElement = TopElement + $(elementToBeChecked).height();
            return ((BotElement <= BotView) && (TopElement >= TopView));
        } else {
            return false;
        }
    },

    setMenuFocus: function() {
        var top = 80 - $(document).scrollTop();
        if ($(document).scrollTop() >= 80){
            top = 0;
        }
        $('.menu').css({'margin-top': top + 'px'});
    },

    resizeMenuNav: function() {
        var sidebar = $(".sidebar-nav-items");
        if (sidebar.length == 0) {
            return;
        }
        var size = $(window).height();
        var footerSize = $(window).scrollTop() + $(window).height() - $(".footer").offset().top;
        if (footerSize > 0) {
            size -= footerSize;
        }
        sidebar.each(function() {
            var newSize = size - ($(this).offset().top - $(window).scrollTop());
            $(this).css("max-height", newSize);
        });
    },

    resizeIframes: function() {
        var isSmall = function() {
            return matchMedia(Foundation.media_queries['small']).matches && !matchMedia(Foundation.media_queries.medium).matches;
        };

        var isMedium = function() {
            return matchMedia(Foundation.media_queries['medium']).matches && !matchMedia(Foundation.media_queries.large).matches;
        };

        var isLarge = function() {
            return matchMedia(Foundation.media_queries['large']).matches;
        };

        if (isMedium() || isLarge()) {
            $("iframe").each(function() {
                $(this).height( $(this).parent().parent().siblings(".documentation_header").height() );
            });
        } else if (isSmall()) {
            $("iframe").each(function() {
                $(this).css("width", "100%");
            });
        }
    },

    cloneSideMenuToOffCanvas: function() {
        var src = $('.sidebar-nav');
        var dest = $('.left-off-canvas-menu');
        if (src.length == 0 || dest.length == 0) {
            return;
        }
        var menu = src.clone();

        // Copy header to menu title
        var header = menu.find('header').detach();
        $('.off-canvas-nav-bar .tab-bar-section .title').append(header);

        // Close menu when an item is clicked.
        menu.find('a').click(function() {
            $('.exit-off-canvas').trigger('click');
        });
        menu.foundation("magellan-expedition", {destination_threshold: 10 + $('.off-canvas-nav-bar').height()});

        dest.append(menu);
    },

    checkOffCanvasVisibility: function() {
        // Reset off canvas section if medium-up
        if (Foundation.utils.is_medium_up()) {
            $('.exit-off-canvas').trigger('click');
        }
    },

    checkOffCanvasMenuPosition: function() {
        var menu = $('.left-off-canvas-menu');
        if (menu.length == 0) {
            return;
        }
        var top = $(document).scrollTop() - $('.off-canvas-wrap').offset().top + $('.off-canvas-nav-bar').height();
        if (top < 0) {
          top = 0;
        }
        menu.css('margin-top', top);
    },

    onResize: function() {
        this.moveFooter();
        this.checkOffCanvasVisibility();
        this.resizeMenuNav();
    },

    onScroll: function() {
        this.setMenuFocus();
        this.checkOffCanvasMenuPosition();
        this.resizeMenuNav();
    },

    demoForm: function() {
        _this = this;

        $('.demo .submit_demo').click(function() {

            var demo = $(this).parents(".demo");
            var form = demo.find("form");
            var results = demo.find(".results");
            var method = form.data('method');
            var isjson = form.data('isjson');
            var endpoint = form.attr('action');
            var data = '';
            var datatype = '';
            var headers = {};
            // console.log(method);
            // console.log(isjson);
            // console.log(endpoint);



            if(isjson) {
                datatype = 'application/json';
                data = {};
                $(form).find('input[type="text"]').each(function(index,input) {
                    var name = $(input).attr('name');
                    var value = $(input).val();
                    data[name] = value
                });
                data = JSON.stringify( data );
                data = {json: data};
            } else {
                data = $(form).serialize();
                datatype = "application/x-www-form-urlencoded";
            }

            $.ajax({
                type: method,
                url: endpoint,
                data: data,
                dataType: datatype,
                xhrFields: {
                    withCredentials: true
                },
                beforeSend: function(xhr) {
                    demo.find("input[data-type='header']").each(function(index, header) {
                        xhr.setRequestHeader($(header).attr("name"), $(header).val());
                    });
                },
                error: function (responseData, textStatus, errorThrown) {
                    results.addClass("error-results");
                    results.show();
                    if (responseData.status == 200) {
                        results.removeClass("error-results");
                        var text = responseData.responseText;
                        if (responseData.getResponseHeader("Content-Type").indexOf("json") >= 0) {
                            text = "<pre class='hljs json'>" + JSON.stringify(JSON.parse(text), undefined, 4) + "</pre>";
                        }
                        results.html("Returned: " + responseData.status + " " + responseData.statusText + "<br/><br/>" + text);
                        $(results).find("pre").each(function(i, block) {
                            hljs.highlightBlock(block);
                        });
                    } else {
                        results.html("Error: " + responseData.status + " " + responseData.statusText);
                    }

                    _this.moveFooter();
                }
            });


        });
    }

};


















