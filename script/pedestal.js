function PedestalComponents(eventDispatcher, scheduler, soundSettings, markers, scoreLoader, animations, blUser) {

    function setPermissionColor(user, el) {
        if (user.hasPermission()) {
            el.setAttribute("material", "color", "#fff")
        } else {
            el.setAttribute("material", "color", "#999")
        }
    }

    function handlePermission(el) {
        blUser.then(function (user) {
            setPermissionColor(user, el);
            user.permissionChanged(function () {
                setPermissionColor(user, el);
            })
        });
    }

    AFRAME.registerComponent('reset', {
        init: function () {
            this.el.addEventListener("click", function (event) {
                blUser.then(function (user) {
                    if (user.hasPermission()) {
                        var index = (scoreLoader.scoreIndex + 1) % scoreLoader.readableScores.length;
                        eventDispatcher.reload(index);
                    }
                });
                event.handled = true;
            });
            handlePermission(this.el);
        }
    });

    AFRAME.registerComponent('clear', {
        init: function () {
            this.el.addEventListener("click", function (event) {
                blUser.then(function (user) {
                    if (user.hasPermission()) {
                        eventDispatcher.clear();
                    }
                });
                event.handled = true;
            });
            handlePermission(this.el);
        }
    });

    AFRAME.registerComponent('double-up', {
        init: function () {
            this.el.addEventListener("click", function (event) {
                blUser.then(function (user) {
                    if (user.hasPermission()) {
                        if (scoreLoader.score.beats < 16) {
                            eventDispatcher.doubleUp();
                        }
                    }
                });
                event.handled = true;
            });
            handlePermission(this.el);
        }
    });

    AFRAME.registerComponent('disco-mode', {
        init: function () {
            animations.discoButton = this.el;
            this.el.addEventListener("click", function () {
                eventDispatcher.toggleDiscoMode();
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
                        eventDispatcher.incrementBpm();
                    } else {
                        eventDispatcher.decrementBpm();
                    }
                    event.handled = true;
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
                    if (!altspace.stubbed) {
                        point = event.detail.point;
                    }
                    el.object3D.worldToLocal(point);

                    //this is utter craziness and just reflects that i don't understand rotation etc
                    //but it does work!
                    if (!altspace.stubbed) {
                        newPoint = {x: point.y, y: point.z};
                    } else {
                        newPoint = {x: point.x, y: point.z};
                    }

                    var data = markers.toInstrumentAndCount(newPoint.x, newPoint.y);
                    if (data.instrumentNumber > -1) {
                        eventDispatcher.addPlayTrigger(data);
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
                    eventDispatcher.stop();
                } else {
                    eventDispatcher.start();
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

    AFRAME.registerComponent('bpm-label', {
        init: function () {
            var el = this.el;
            el.setAttribute("n-text", {text: scoreLoader.score.bpm + " BPM", fontSize: "1pt"});
            scoreLoader.score.addEventListener("bpm-change", function (bpm) {
                el.setAttribute("n-text", {text: bpm + " BPM", fontSize: "1pt"});
            })
        }
    });

    AFRAME.registerComponent('animate-theta', {
        init: function () {
            var self = this;
            var el = this.el;
            scheduler.addEventListener("time", function (count) {
                var degreesPerSeg = ((360 / scoreLoader.score.beats)) / soundSettings.segmentsPerBeat;
                var currentDegrees = count * degreesPerSeg;
                el.setAttribute("theta-start", currentDegrees + 0.05);    //OMFG i have no idea why i have to add this little number, but if i don't, it doesn't work!!
                //console.log(el.getAttribute("theta-length") + "; current="+currentDegrees+" - beat="+event.detail.beatCount + "; seg="+event.detail.seg);
            });
        }
    });
}