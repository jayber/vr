function Instruments(score, soundSettings, markers, scheduler) {
    var self = this;
    self.instruments = [];

    AFRAME.registerComponent('instrument', {
        schema: {type: 'string'},
        init: function () {
            self.instruments.push(this);
            var el = this.el;
            el.instrument = this;
            this.listenToSchedule(score[this.data].parsedTimes, el, this);
            this.color = el.getAttribute("material").color;
            this.generateMarkers(score[this.data].parsedTimes);
            this.createCable(el);
            this.makeClickable(this, el);
        },

        addTrigger: function (data) {
            markers.marker(data.count, this);
            scheduler.addCountListener(data.count, this.countListener);
            scheduler.addTriggerTime(data.count, score[this.data].src);
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
            scheduler.removeTriggerTime(count, score[this.data].src);
            scheduler.removeCountListener(count, this.countListener);
        },

        generateMarkers: function (times) {
            var sself = this;
            sself.instrumentIndex = self.instruments.length - 1;
            times.forEach(function (time) {
                markers.marker(time.count, sself, sself.instrumentIndex);
            });
        },

        listenToSchedule: function (times, el, self) {
            self.flasherElements = [el];
            self.flash = function (target) {
                self.flasherElements.push(target);
            };
            self.countListener = function (time) {
                self.dispatchFlash();
            };
            self.dispatchFlash = function () {
                self.flasherElements.forEach(function (target) {
                    target.setAttribute('material', 'color', "#fff");
                });
            };
            self.dispatchUnflash = function () {
                self.flasherElements.forEach(function (target) {
                    target.setAttribute('material', 'color', self.color);
                });
            };
            scheduler.addCountsListener(times, self.countListener);
            scheduler.addEventListener("timeoff", function (count) {
                self.dispatchUnflash();
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