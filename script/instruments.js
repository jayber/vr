function Instruments(scoreLoader) {
    var self = this;
    self.instruments = [];

    self.remove = function (instrumentIndex, count, elementId) {
        var subElement = document.querySelector("#" + elementId);
        document.querySelector("#clock-face").removeChild(subElement);
        self.instruments[instrumentIndex].removeTime(count);
        var index = self.instruments[instrumentIndex].markers.indexOf(subElement);
        self.instruments[instrumentIndex].markers.splice(index, 1);
    };

    self.add = function (data) {
        var instrument = self.instruments[data.instrumentNumber];
        instrument.addTrigger(data);
    };

    self.reload = function () {
        var dial = document.querySelector("#clock-face");
        self.instruments.forEach(function (instrument) {
            instrument.markers.forEach(function (marker) {
                dial.removeChild(marker);
            });

            instrument.generateMarkers(scoreLoader.score.instruments[instrument.data].times);
        });
    };
}

function InstrumentComponents(instruments, scoreLoader, markers, soundSettings, scheduler) {

    AFRAME.registerComponent('instrument', {
        schema: {type: 'string'},
        init: function () {
            instruments.instruments.push(this);
            var el = this.el;
            el.instrument = this;
            this.color = el.getAttribute("material").color;
            this.listenToSchedule(this.color, el, this);
            this.instrumentIndex = instruments.instruments.length - 1;
            this.generateMarkers(scoreLoader.score.instruments[this.data].times);
            this.createCable(el);
            this.makeClickable(this, el, this.color);
        },

        addTrigger: function (data) {
            this.markers.push(markers.marker(data.count, this));
            scoreLoader.score.addInstrumentTrigger(data.count, this.data);
        },

        makeClickable: function (self, el, color) {
            el.setAttribute("altspace-cursor-collider");
            el.addEventListener("click", function () {
                soundSettings.play(scoreLoader.score.instruments[self.data].src);
                self.dispatchFlash(self);
                setTimeout(function () {
                    self.dispatchUnflash(self, color);
                }, 150);
            });
        },

        removeTime: function (count) {
            scoreLoader.score.removeInstrumentTrigger(count, this.data);
        },

        generateMarkers: function (times) {
            var sself = this;
            sself.markers = [];
            times.forEach(function (time) {
                sself.markers.push(markers.marker(time.count, sself));
            });
        },

        listenToSchedule: function (color, el, self) {
            self.flasherElements = [el];
            self.flash = function (target) {
                self.flasherElements.push(target);
            };

            scheduler.addInstrumentListener(self.data, function () {
                self.dispatchFlash(self)
            }, function () {
                self.dispatchUnflash(self, color)
            });
        },

        dispatchFlash: function (self) {
            self.flasherElements.forEach(function (target) {
                target.setAttribute('material', 'color', "#fff");
            });
        },

        dispatchUnflash: function (self, color) {
            self.flasherElements.forEach(function (target) {
                target.setAttribute('material', 'color', color);
            });
        },

        createCable: function (el) {
            var self = this;
            var start = el.object3D.getWorldPosition();
            var instrumentFloor = new THREE.Vector3(start.x, 0, start.z);
            var path = new THREE.CurvePath();
            path.add(new THREE.LineCurve3(start, instrumentFloor));
            path.add(new THREE.LineCurve3(instrumentFloor, new THREE.Vector3(0, 0, 0)));
            var geometry = new THREE.TubeGeometry(path, 64, 0.02, 8, false);

            var tube = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({}));
            var cableElement = document.createElement("a-entity");
            cableElement.setObject3D("mesh", tube);
            document.querySelector("#root").appendChild(cableElement);

            cableElement.setAttribute('material', {color: self.color, src: "#cable-texture", repeat: '100 1'});
            self.flash(cableElement);
        }
    });

    AFRAME.registerComponent('ring', {
        schema: {type: 'string'},
        init: function () {
            var el = this.el;
            var self = this;

            var target = document.querySelector("[instrument^=\"" + this.data + "\"]");

            target.addEventListener("loaded", function (event) {
                el.setAttribute("color", target.instrument.color);
                target.instrument.flash(el);
            });
        }
    });
}