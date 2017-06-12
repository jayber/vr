function Instruments(scoreLoader, eventDispatcher) {
    var self = this;
    self.instruments = [];

    eventDispatcher.addEventListener("removePlayTrigger", function (data) {
        self.remove(data.instrumentNumber, data.count, data.elementId);
    });

    eventDispatcher.addEventListener("addPlayTrigger", function (data) {
        self.add(data);
    });

    self.remove = function (instrumentIndex, count, elementId) {
        var instrument = self.instruments[instrumentIndex];
        instrument.removeTrigger(elementId, count);
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

function InstrumentComponents(instruments, scoreLoader, markers, soundSettings, scheduler, animations, sceneLoaded) {

    AFRAME.registerComponent('instrument', {
        schema: {type: 'string'},
        init: function () {
            instruments.instruments.push(this);
            var el = this.el;
            el.instrument = this;
            this.color = el.getAttribute("material").color;
            this.listenToSchedule(this.color, el, this.data);
            this.instrumentIndex = instruments.instruments.length - 1;
            this.generateMarkers(scoreLoader.score.instruments[this.data].times);
            this.createCable(el);
            this.makeClickable(this, el);
        },

        addTrigger: function (data) {
            this.markers.push(markers.marker(data.count, this));
            scoreLoader.score.addInstrumentTrigger(data.count, this.data);
        },

        removeTrigger: function (elementId, count) {
            var subElement = document.querySelector("#" + elementId);
            document.querySelector("#clock-face").removeChild(subElement);
            scoreLoader.score.removeInstrumentTrigger(count, this.data);
            var index = this.markers.indexOf(subElement);
            this.markers.splice(index, 1);
        },

        makeClickable: function (self, el) {
            el.addEventListener("click", function () {
                soundSettings.play(scoreLoader.score.instruments[self.data].src);
                animations.flash(self.data, true);
                setTimeout(function () {
                    animations.unflash(self.data, true);
                }, 150);
            });
        },

        generateMarkers: function (times) {
            var sself = this;
            sself.markers = [];
            times.forEach(function (time) {
                sself.markers.push(markers.marker(time.count, sself));
            });
        },

        listenToSchedule: function (color, el, name) {
            animations.registerMasterFlasher(name, color, el);

            scheduler.addInstrumentListener(name, function () {
                animations.flash(name, true);
            }, function () {
                animations.unflash(name, true);
            });
        },

        flash: function (target) {
            animations.registerSlaveFlasher(this.data, target);
        },

        createCable: function (el) {
            var self = this;
            var sceneEl = el.sceneEl;
            if (sceneEl.hasLoaded) {
                resolve();
            } else {
                sceneEl.addEventListener("loaded", function () {
                    resolve();
                });
            }
            function resolve() {
                var start = el.object3DMap.mesh.getWorldPosition();
                var instrumentFloor = new THREE.Vector3(start.x, 0, start.z);
                var path = new THREE.CurvePath();
                path.add(new THREE.LineCurve3(start, instrumentFloor));
                path.add(new THREE.LineCurve3(instrumentFloor, new THREE.Vector3(0, 0, 0)));
                var geometry = new THREE.TubeGeometry(path, 16, 0.02, 4, false);

                var tube = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({}));
                var cableElement = document.createElement("a-entity");
                cableElement.setObject3D("mesh", tube);
                document.querySelector("#root").appendChild(cableElement);

                cableElement.setAttribute('material', {color: self.color, src: "#cable-texture", repeat: '100 1'});
                cableElement.setAttribute("altspace-cursor-collider", "enabled", "false");
                self.flash(cableElement);
            }
        }
    });

    AFRAME.registerComponent('rings', {
        init: function () {
            var el = this.el;
            var self = this;
            sceneLoaded.then(function () {
                self.addRings(el)
            });
        },

        addRings: function (rings) {
            var current = 0.180;
            instruments.instruments.forEach(function (instrument) {
                var ring = document.createElement("a-ring");
                ring.setAttribute("radius-outer", current);
                ring.setAttribute("radius-inner", current - 0.002);
                ring.setAttribute("color", instrument.color);
                instrument.flash(ring);
                rings.appendChild(ring);
                current += 0.05;
            });
        }
    });
}