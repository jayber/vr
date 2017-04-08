new function () {
    var self = this;
    var soundSettings = sound;
    var scheduler = new AudioAndAnimationScheduler(soundSettings.audioCtx);

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
            var sself = this;
            var start = srcEntity.object3D.getWorldPosition();
            var instrumentFloor = new THREE.Vector3(start.x, 0, start.z);
            var path = new THREE.CurvePath();
            path.add(new THREE.LineCurve3(start, instrumentFloor));
            path.add(new THREE.LineCurve3(instrumentFloor, new THREE.Vector3(0, 0, 0)));
            var geometry = new THREE.TubeGeometry(path, 64, 0.015, 8, false);

            var texture = new THREE.TextureLoader().load("img/cable_stripe.png");
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(100, 1);

            var material = new THREE.MeshBasicMaterial({
                map: texture,
                color: srcEntity.getAttribute("material").color
            });
            var tube = new THREE.Mesh(geometry, material);
            sself.el.setObject3D("mesh", tube);

            sound.setFlashing(srcEntity, sself.el);
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

    window.onload = function () {
        var srcEntity = document.querySelector("a-scene");
        if (srcEntity.hasLoaded) {
            new ScoreLoader(scheduler, soundSettings);
        } else {
            srcEntity.addEventListener('loaded', function () {
                new ScoreLoader(scheduler, soundSettings);
            });
        }
    };
};