var bpm = 110;
var duration = 60000 / bpm;
var noOfSegments = 32;

AFRAME.registerComponent('beat', {
    init: function () {
        var el = this.el;
        var curSeg = 0;
        var count = 0;
        var player = setInterval(function () {
            el.emit('beat-fraction', {seg: curSeg++}, false);
            count++;
            if ((count % noOfSegments) == 0) {
                el.emit('beat');
                curSeg = 0;
            }
            if (count / noOfSegments === 20) {
                clearInterval(player);
                console.log("clear");
            }
        }, duration / noOfSegments);
    }
});

AFRAME.registerComponent('beat-listener', {
    schema: {
        src: {type: 'string', default: ''},
        seg: {type: 'number', default: 0}
    },
    init: function () {
        var el = this.el;
        var self = this;
        var beater = document.querySelector(this.data.src);
        beater.addEventListener("beat-fraction", function (event) {
            console.log("listener, seg=" + event.detail.seg);
            if (event.detail.seg === self.data.seg) {
                el.emit('beat');
            }
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
            var thetaLength = (360 * beatFraction);
            el.setAttribute("geometry", "thetaLength", thetaLength);
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
