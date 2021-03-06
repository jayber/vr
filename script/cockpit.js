function CockpitComponents(soundSettings, animations) {

    AFRAME.registerComponent('animations-toggle', {
        init: function () {
            var el = this.el;
            var self = this;
            if (!animations.animations) {
                el.setAttribute("material", "src", "#animationsOn");
                el.setAttribute("color", "#999");
            }
            el.addEventListener("click", function (event) {
                animations.toggleAnimations();
                if (animations.animations) {
                    el.setAttribute("material", "src", "#animationsOff");
                    el.setAttribute("color", "#fff");
                } else {
                    el.setAttribute("material", "src", "#animationsOn");
                    el.setAttribute("color", "#999");
                }
            });
        }
    });

    AFRAME.registerComponent('highlight', {
        init: function () {
            var self = this;
            this.el.addEventListener("mousedown", function (event) {
                self.el.setAttribute("color", "#999");
            });
            this.el.addEventListener("mouseup", function (event) {
                self.el.setAttribute("color", "#fff");
            });
        }
    });

    AFRAME.registerComponent('mute', {
        init: function () {
            var el = this.el;
            var self = this;
            el.addEventListener("click", function (event) {
                console.log("muted");
                soundSettings.mute = !soundSettings.mute;
                if (soundSettings.mute) {
                    el.setAttribute("material", "src", "#unmute");
                    el.setAttribute("color", "#999");
                } else {
                    el.setAttribute("material", "src", "#mute");
                    el.setAttribute("color", "#fff");
                }
            });
        }
    });

    AFRAME.registerComponent('volume-control', {
        schema: {type: 'string'},
        init: function () {
            var el = this.el;
            var self = this;

            el.addEventListener("click", function (event) {
                if (self.data == "up") {
                    soundSettings.incrementVol();
                } else {
                    soundSettings.decrementVol();
                }
            });
        }
    });
}