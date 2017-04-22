function Cockpit(soundSettings) {

    AFRAME.registerComponent('mute', {
        init: function () {
            var el = this.el;
            var self = this;
            el.addEventListener("click", function (event) {
                console.log("muted");
                soundSettings.mute = !soundSettings.mute;
                if (soundSettings.mute) {
                    el.setAttribute("material", "src", "#unmute");
                    el.setAttribute("color", "#aaa");

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