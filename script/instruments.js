function Instruments(score, soundSettings, markers, scheduler) {
    var self = this;
    self.instruments = [];

    AFRAME.registerComponent('instrument', {
        schema: {type: 'string'},
        init: function () {
            self.instruments.push(this);
            var el = this.el;
            el.instrument = this;
            this.color = el.getAttribute("material").color;
            this.listenToSchedule(this.color, el, this);
            this.generateMarkers(score[this.data].parsedTimes);
            this.createCable(el);
            this.makeClickable(this, el);
        },

        addTrigger: function (data) {
            markers.marker(data.count, this);
            scheduler.addInstrumentTrigger(data.count, this.data);
        },

        makeClickable: function (self, el) {
            el.setAttribute("altspace-cursor-collider");
            el.addEventListener("click", function () {
                soundSettings.play(score[self.data].src);
                self.dispatchFlash();
                setTimeout(function () {
                    self.dispatchUnflash();
                }, 150);
            });
        },

        removeTime: function (count) {
            scheduler.removeInstrumentTrigger(count, this.data);
        },

        generateMarkers: function (times) {
            var sself = this;
            sself.instrumentIndex = self.instruments.length - 1;
            times.forEach(function (time) {
                markers.marker(time.count, sself, sself.instrumentIndex);
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