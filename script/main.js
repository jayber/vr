function reportException(e) {
    var data;
    altspace.getUser().then(function (user) {
        try {
            if (e.error) {
                data = {userId: user.userId, message: e.error.message, stack: e.error.stack};
            } else if (e.message) {
                data = {userId: user.userId, message: e.message, stack: ""};
            } else {
                e.userId = user.userId;
                data = JSON.stringify(e);
            }
            $.get("error", data);
        } catch (e) {
        }
    });
}

function serverLog(message) {
    altspace.getUser().then(function (user) {
        $.get("log", {userId: user.userId, message: message});
    });
}

window.addEventListener('error', function (e) {
    reportException(e);
});

(function () {
    var self = this;

    serverLog("userAgent: " + navigator.userAgent + "; isGear: " + isGearVR());

    var soundSettings = new SoundSettings();
    var scoreLoader = new ScoreLoader(soundSettings);
    var score = scoreLoader.score;
    var scheduler = new AudioAndAnimationScheduler(soundSettings.audioCtx);
    var markers = new Markers(soundSettings);
    var instruments = [];
    var events = new EventDispatcher(scheduler, soundSettings, instruments, markers, score, scoreLoader);

    AFRAME.registerComponent('ring', {
        schema: {type: 'string'},
        init: function () {
            var el = this.el;
            var self = this;

            var target = document.querySelector("[instrument^=\"" + this.data + "\"]");

            target.addEventListener("loaded", function (event) {
                el.setAttribute("color", target.getAttribute("material").color);
            });
        }
    });

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

    AFRAME.registerComponent('bpm-change', {
        schema: {type: 'string'},
        init: function () {
            var el = this.el;
            var self = this;

            el.addEventListener("click", function (event) {
                if (!event.handled) {
                    if (self.data == "up") {
                        events.incrementBpm();
                    } else {
                        events.decrementBpm();
                    }
                    event.handled = true;
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

    AFRAME.registerComponent('timer', {
        init: function () {
            var el = this.el;
            var self = this;

            el.addEventListener("raycaster-intersected", function (event) {
                self.intersectionPoint = event.detail.intersection.point;
            });

            el.addEventListener("click", function (event) {
                if (!event.handled) {
                    var newPoint;
                    var point = self.intersectionPoint;
                    if (point == undefined) {
                        point = event.detail.point;
                    }
                    serverLog("world point: " + JSON.stringify(point));
                    el.object3D.worldToLocal(point);
                    serverLog("localised point: " + JSON.stringify(point));

                    //this is utter craziness and just reflects that i don't understand rotation etc
                    //but it does work!
                    if (self.intersectionPoint == undefined) {
                        newPoint = {x: point.y, y: point.z};
                    } else {
                        newPoint = {x: point.x, y: point.z};
                    }

                    serverLog("starting point: " + JSON.stringify(newPoint));
                    var data = markers.toInstrumentAndCount(newPoint.x, newPoint.y);
                    serverLog("instrument and count: " + JSON.stringify(data));
                    if (data.instrumentNumber > -1) {
                        events.addPlayTrigger(data, events);
                        event.handled = true;
                    }
                }
            });
        }
    });

    AFRAME.registerComponent('playable', {
        init: function () {
            var el = this.el;

            el.addEventListener("click", function () {
                if (self.isStarted) {
                    events.stop();
                } else {
                    events.start();
                }
            });

            scheduler.addEventListener("start", function () {
                self.isStarted = true;
                el.setAttribute("color", "#8d6")
            });

            scheduler.addEventListener("stop", function () {
                self.isStarted = false;
                el.setAttribute("color", "#f99")
            });
        }
    });

    AFRAME.registerComponent('instrument', {
        schema: {type: 'string'},
        init: function () {
            instruments.push(this);
            var el = this.el;
            soundSettings.registerSound(score[this.data].src, score[this.data].parsedTimes);
            this.listenToSchedule(score[this.data].parsedTimes, el, this);
            this.color = el.getAttribute("material").color;
            this.generateMarkers(score[this.data].parsedTimes);
            this.createCable(el);
            this.makeClickable(this, el);
        },

        addTrigger: function (data, events) {
            markers.marker(data.count, this, data.instrumentNumber, events);
            scheduler.addCountListener(data.count, this.countListener);
            soundSettings.addTriggerTime(data.count, score[this.data].src);
        },

        makeClickable: function (self, el) {
            el.setAttribute("altspace-cursor-collider");
            el.addEventListener("click", function () {
                soundSettings.play(score[self.data].src);
                el.emit("playtime");
                setTimeout(function () {
                    el.emit("playoff")
                }, 150);
            });
        },

        removeTime: function (count) {
            soundSettings.removeTriggerTime(count, score[this.data].src);
            scheduler.removeCountListener(count, this.countListener);
        },

        generateMarkers: function (times) {
            var instrumentIndex = instruments.length - 1;
            var self = this;
            times.forEach(function (time) {
                markers.marker(time.count, self, instrumentIndex, events);
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

    AFRAME.registerComponent('bpm-label', {
        init: function () {
            var el = this.el;
            el.setAttribute("n-text", {text: soundSettings.bpm + " BPM", fontSize: "1pt"});
            soundSettings.addEventListener("bpm-change", function (event) {
                el.setAttribute("n-text", {text: event + " BPM", fontSize: "1pt"});
            })
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
                el.setAttribute("theta-start", currentDegrees + 0.05);    //OMFG i have no idea why i have to add this little number, but if i don't, it doesn't work!!
                //console.log(el.getAttribute("theta-length") + "; current="+currentDegrees+" - beat="+event.detail.beatCount + "; seg="+event.detail.seg);
            });
        }
    });
})();
