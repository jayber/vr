new function () {
    var self = this;
    var soundSettings = new SoundSettings();
    var scheduler = new AudioAndAnimationScheduler(soundSettings.audioCtx);
    var instrumentCount = 0;

    var score = loadScore(soundSettings);

    AFRAME.registerComponent('playable', {
        init: function () {
            var el = this.el;
            var sself = this;

            el.addEventListener("click", function () {
                if (self.isStarted) {
                    sself.stop(el);
                } else {
                    sself.start(el);
                }
            });
        },

        start: function (el) {
            scheduler.start(soundSettings.segmentDuration, soundSettings.totalSegments, soundSettings.soundList, soundSettings.soundBuffersMap);
            self.isStarted = true;
            el.setAttribute("color", "#8d6")
        },

        stop: function (el) {
            scheduler.stop();
            self.isStarted = false;
            el.setAttribute("color", "#f99")
        }
    });

    AFRAME.registerComponent('instrument', {
        schema: {type: 'string'},
        init: function () {
            var el = this.el;
            this.listenToSchedule(score[this.data].parsedTimes, el);
            this.color = el.getAttribute("material").color;
            this.flash(el, el);
            this.generateMarkers(score[this.data].parsedTimes, el);
            this.createCable(el);
        },

        flash: function (el, target) {
            var self = this;
            el.addEventListener("playtime", function () {
                target.setAttribute('color', "#fff");
            });
            el.addEventListener("playoff", function () {
                target.setAttribute('color', self.color);
            });
        },

        generateMarkers: function (times, el) {
            var count = instrumentCount++;
            var self = this;
            times.forEach(function (time) {
                var angle = (time.beat * (360 / soundSettings.beats)) + (time.seg * (360 / (soundSettings.segmentsPerBeat * soundSettings.beats)));
                var startRad = 0.134;
                var step = 0.05;
                var rad = startRad + (instrumentCount * step);
                var newX = Math.cos(angle * (Math.PI / 180)) * rad;
                var newY = Math.sin(angle * (Math.PI / 180)) * rad;

                var subElement = document.createElement("a-sphere");
                subElement.setAttribute("radius", "0.027");
                subElement.setAttribute("position", newY + " -0.025 " + newX);

                subElement.setAttribute("color", self.color);
                self.flash(el, subElement);

                var clockFace = document.querySelector('#clock-face');
                clockFace.appendChild(subElement);
            });
        },

        listenToSchedule: function (times, el) {
            const countTimes = times.map(function (time) {
                return soundSettings.convertTimeToCount(time);
            });
            scheduler.addCountListener(countTimes, function (count) {
                el.emit('playtime');
            });
            scheduler.addEventListener("timeoff", function (count) {
                el.emit('playoff');
            });
        },

        createCable: function (srcEntity) {
            var self = this;
            var start = srcEntity.object3D.getWorldPosition();
            var instrumentFloor = new THREE.Vector3(start.x, 0, start.z);
            var path = new THREE.CurvePath();
            path.add(new THREE.LineCurve3(start, instrumentFloor));
            path.add(new THREE.LineCurve3(instrumentFloor, new THREE.Vector3(0, 0, 0)));
            var geometry = new THREE.TubeGeometry(path, 64, 0.02, 8, false);

            var materialSrc = "img/cable_stripe.png";
            var texture = new THREE.TextureLoader().load(materialSrc);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(100, 1);

            var material = new THREE.MeshBasicMaterial({
                map: texture,
                color: srcEntity.getAttribute("material").color
            });
            var tube = new THREE.Mesh(geometry, material);
            var cableElement = document.createElement("a-entity");
            cableElement.setObject3D("mesh", tube);
            document.querySelector("a-scene").appendChild(cableElement);

            flash(srcEntity, cableElement);

            function flash() {
                var white = new THREE.Color();
                var startingColor = new THREE.Color(self.color);
                srcEntity.addEventListener("playtime", function () {
                    tube.material.color = white;
                });
                srcEntity.addEventListener("playoff", function () {
                    tube.material.color = startingColor;
                });
            }
        }
    });

    AFRAME.registerComponent('bpm-label', {
        init: function () {
            var el = this.el;
            el.setAttribute("n-text", {text: soundSettings.bpm + " BPM", fontSize: "1pt"});
        }
    });

    AFRAME.registerComponent('animate-theta', {
        init: function () {
            var self = this;
            var el = this.el;
            self.degreesPerBeat = (360 / soundSettings.beats);
            self.degreesPerSeg = self.degreesPerBeat / soundSettings.segmentsPerBeat;
            scheduler.addEventListener("time", function (count) {
                var currentDegrees = count * self.degreesPerSeg;
                try {
                    el.setAttribute("theta-start", currentDegrees + 0.05);    //OMFG i have no idea why i have to add this little number, but if i don't, it doesn't work!!
                    //console.log(el.getAttribute("theta-length") + "; current="+currentDegrees+" - beat="+event.detail.beatCount + "; seg="+event.detail.seg);
                } catch (error) {
                    console.log(error);
                }
            });
        }
    });
};