
var bpm = 200;
var duration = 60000 / bpm;

AFRAME.registerComponent('beat', {
    init: function () {
        var el = this.el;
        var count = 0;
        var player = setInterval(function () {
            var sound = el.emit('beat');
            count++;
            if (count === 5) {
                clearInterval(player);
            }
        }, duration);
    }
});

AFRAME.registerComponent('beat-listener', {
    schema: { src: {type: 'string', default: ''}},
    init: function () {
        var el = this.el;
        var beater = document.querySelector(this.data.src);
        beater.addEventListener("beat", function() {
            el.emit('beat');
        });
    }
});

AFRAME.registerComponent('animate-theta', {
    init: function() {
        var self = this;
        self.beatTime = (new Date()).getTime();
        this.el.addEventListener("beat", function(event) {
            self.beatTime = (new Date()).getTime();
        });
    },
    tick: function (time, timeDelta) {
        var el = this.el;
        var interval = (new Date()).getTime() - this.beatTime;
        var beatFraction = interval / duration;
        if (beatFraction < 1) {
            el.setAttribute("geometry", "thetaLength", (360 * beatFraction));
        }
    }
});

AFRAME.registerComponent('flash', {
    schema: {
        on: {type: 'string', default: ''},
        from: {type: 'string', default: ''},
        delay: {type: 'number', default: ''},
        dur: {type: 'number', default: ''},
        to: {type: 'string', default: ''}
    },
    init: function () {
        var el = this.el;
        var self = this;
        el.addEventListener(this.data.on, function () {
            setTimeout(function() {
                el.setAttribute('material', 'color', self.data.to);
            }, self.data.delay);
            setTimeout(function() {
                el.setAttribute('material', 'color', self.data.from);
             }, self.data.delay+self.data.dur);
        });
    }
});
