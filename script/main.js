const bpm = 100;
const beatDuration = 60000 / bpm;
const noOfSegments = 4;
const segmentDuration = Math.floor(beatDuration / noOfSegments);

const noOfBeats = 4;
const noOfRepeats = 4;

var dialRadiusMultiplier = 0.03;

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var worker = new Worker('script/worker.js');
var soundBuffersMap = {};

function setFlashing(srcEntity, el) {
    if (srcEntity.hasAttribute("flash")) {
        var flash = srcEntity.getAttribute("flash");
        srcEntity.addEventListener("playtime", function () {
            el.object3DMap["mesh"].material.color.set(flash.to);
        });
        srcEntity.addEventListener("playoff", function () {
            el.object3DMap["mesh"].material.color.set(flash.from);
        });
    }
}

AFRAME.registerComponent('playable', {
    init: function () {
        var el = this.el;
        var self = this;
        console.log("playable");
        worker.onmessage = function (event) {
            var eventName = event.data.name;
            if (eventName == 'log') {
                console.log(event.data.message);
            } else if (eventName == 'schedule') {
                console.log(JSON.stringify(event.data));
                event.data.sounds.forEach(function (soundName) {
                    var source = audioCtx.createBufferSource();
                    source.buffer = soundBuffersMap[soundName];
                    source.connect(audioCtx.destination);
                    source.start(event.data.when / 1000);
                });
            } else {
                el.emit(eventName, event.data.data);
            }
        };

        el.addEventListener("click", function () {
            self.start();
        });
    },

    start: function () {
        worker.postMessage({
            name: "start",
            data: [segmentDuration, noOfSegments, noOfBeats, noOfRepeats, beatDuration]
        });
    }
});

AFRAME.registerComponent('j-sound', {
    schema: {
        src: {type: 'string', default: ''},
        on: {type: 'array'}
    },
    init: function () {
        var el = this.el;
        var self = this;
        var loader = new AudioSampleLoader();
        loader.src = this.data.src;
        loader.ctx = audioCtx;
        loader.onload = function () {
            soundBuffersMap[self.data.src] = loader.response;
        };
        loader.send();
    }
});

AFRAME.registerComponent('time-listener', {
    schema: {
        src: {type: 'string', default: ''},
        beat: {type: 'array'},
        seg: {type: 'array'},
        display: {type: 'boolean', default: true}
    },

    init: function () {
        var el = this.el;
        var self = this;
        var zip = this.data.beat.map(function (element, index) {
            return [element, self.data.seg[index]];
        });

        if (this.data.display) {
            this.generateMarkers(zip);
        }

        if (el.hasAttribute("j-sound")) {
            worker.postMessage({name: "register-sound", src: el.getAttribute("j-sound").src, times: zip});
        }

        this.listenToBeater(zip, el);
    },

    listenToBeater: function (zip, el) {
        var beater = document.querySelector(this.data.src);
        beater.addEventListener("time", function (event) {
            if (zip.length == 0) {
                el.emit('playtime', event.detail);
            } else if (zip.find(function (element) {
                    return element[0] == event.detail.beatCount && element[1] == event.detail.seg;
                })) {
                el.emit('playtime', event.detail);
            }
        });
    },

    generateMarkers: function (times) {
        var el = this.el;
        var multi = dialRadiusMultiplier++;
        times.forEach(function (time) {
            try {
                var angle = (time[0] * (360 / noOfBeats)) + (time[1] * (360 / (noOfSegments * noOfBeats)));

                var subElement = document.createElement("a-sphere");
                subElement.setAttribute("radius", "0.03");
                var clockFace = document.querySelector('#clock-face');
                var parentRadius = clockFace.getAttribute('radius');

                var startRad = 0.25;
                var step = 0.032;
                var rad = startRad + (multi * step);

                var newX = Math.cos(angle * (Math.PI / 180)) * rad;
                var newY = Math.sin(angle * (Math.PI / 180)) * rad;
                subElement.setAttribute("position", newY + " -0.025 " + newX);

                var color = el.getAttribute("material").color;
                subElement.setAttribute("color", color);
                clockFace.appendChild(subElement);

                setFlashing(el, subElement);
            } catch (error) {
                console.log(error);
            }
        });
    }
});

AFRAME.registerComponent('playoff', {
    schema: {type: 'string'},
    init: function () {
        var el = this.el;
        var played = false;

        el.addEventListener("playtime", function () {
            played = true;
        });

        var beater = document.querySelector(this.data);
        beater.addEventListener("time", function (event) {
            if (played) {
                played = false;
                el.emit('playoff');
            }
        });
    }
});

AFRAME.registerComponent('cable', {
    schema: {type: 'string'},
    init: function () {
        var self = this;
        var srcEntity = document.querySelector(self.data);

        if (srcEntity.hasLoaded) {
            self.createCable(srcEntity);
        } else {
            srcEntity.addEventListener('loaded', function () {
                self.createCable(srcEntity);
            });
        }
        srcEntity.addEventListener('playtime', function () {
            self.el.emit("playtime");
        });
    },

    createCable: function (srcEntity) {
        var self = this;
        var start = srcEntity.object3D.getWorldPosition();
        var instrumentFloor = new THREE.Vector3(start.x, 0, start.z);
        var path = new THREE.CurvePath();
        path.add(new THREE.LineCurve3(start, instrumentFloor));
        path.add(new THREE.LineCurve3(instrumentFloor, new THREE.Vector3(0, 0, 0)));
        var geometry = new THREE.TubeGeometry(path, 64, 0.015, 8, false);

        var texture = new THREE.TextureLoader().load("img/stripe2.png");
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(100, 1);

        var material = new THREE.MeshBasicMaterial({
            map: texture,
            color: srcEntity.getAttribute("material").color
        });
        var tube = new THREE.Mesh(geometry, material);
        self.el.setObject3D("mesh", tube);

        setFlashing(srcEntity, self.el);
    }
});

AFRAME.registerComponent('bpm-label', {
    init: function () {
        var el = this.el;
        el.setAttribute("n-text", {text: bpm + " BPM", fontSize: "1pt"});
    }
});

AFRAME.registerComponent('animate-theta', {
    init: function () {
        var self = this;
        var el = this.el;
        self.degreesPerBeat = (360 / noOfBeats);
        self.degreesPerSeg = self.degreesPerBeat / noOfSegments;
        el.addEventListener("playtime", function (event) {
            var now = event.detail.now;
            if (event.detail.seg === 0) {
                self.lastBeatTime = now;
            }
            var currentDegrees = ((event.detail.beatCount * noOfSegments) + event.detail.seg) * self.degreesPerSeg;
            try {
                el.setAttribute("theta-length", currentDegrees + 0.05);    //OMFG i have no idea why i have to add this little number, but if i don't, it doesn't work!!
                //console.log(el.getAttribute("theta-length") + " - beat="+event.detail.beatCount + "; seg="+event.detail.seg);
            } catch (error) {
                console.log(error);
            }
        });
    }
});

AFRAME.registerComponent('flash', {
    schema: {
        from: {type: 'string', default: ''},
        delay: {type: 'number', default: ''}
    },
    init: function () {
        var el = this.el;
        var self = this;
        el.addEventListener("playtime", function () {
            el.setAttribute('material', 'color', self.data.to);
        });
        el.addEventListener("playoff", function () {
            el.setAttribute('material', 'color', self.data.from);
        });
    }
});
