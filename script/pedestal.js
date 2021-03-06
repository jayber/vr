function PedestalComponents(eventDispatcher, scheduler, soundSettings, markers, scoreLoader, animations, blUser, instruments) {

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

    AFRAME.registerComponent('mods-only', {
        init: function () {
            var el = this.el;
            el.addEventListener("click", function (event) {
                blUser.then(function (user) {
                    if (user.moderator || blUser.demoer) {
                        if (user.modOnly) {
                            eventDispatcher.modOnlyOff();
                        } else {
                            eventDispatcher.modOnlyOn();
                        }
                    }
                });
                event.handled = true;
            });
            blUser.then(function (user) {
                function setModOnlyColor() {
                    if (user.modOnly) {
                        el.setAttribute("material", "color", "#0a0")
                    } else if (user.moderator) {
                        el.setAttribute("material", "color", "#000")
                    } else {
                        el.setAttribute("material", "color", "#999")
                    }
                }

                setModOnlyColor();
                user.modOnlyChanged(function () {
                    setModOnlyColor();
                })
            });
        }
    });

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

    AFRAME.registerComponent('lock', {
        init: function () {
            var self = this;

            blUser.then(function (blUser) {
                if (blUser.user.isModerator || blUser.demoer) {
                    self.el.setAttribute("material", "color", "#fff");
                }
            });

            this.el.addEventListener("click", function () {
                blUser.then(function (blUser) {
                    if (blUser.user.isModerator || blUser.demoer) {
                        eventDispatcher.setFreeForAll(!blUser.isFreeForAll());
                    }
                });
                event.handled = true;
            });

            eventDispatcher.addEventListener("freeForAllOn", function () {
                    self.el.setAttribute("material", "src", "#unlock-texture");
            });

            eventDispatcher.addEventListener("freeForAllOff", function () {
                self.el.setAttribute("material", "src", "#lock-texture");
            });
        }
    });

    AFRAME.registerComponent('disco-mode', {
        init: function () {
            animations.discoButton = this.el;
            this.el.addEventListener("click", function () {
                if (animations.discoMode) {
                    eventDispatcher.discoModeOff();
                } else {
                    eventDispatcher.discoModeOn();
                }
                event.handled = true;
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

    AFRAME.registerComponent('science', {
        schema: {type: 'string'},
        init: function () {
            var el = this.el;
            el.setAttribute("n-mesh-collider", "convex:false");

            el.addEventListener("click", function (event) {
                if (!event.handled) {
                    soundSettings.play(soundSettings.eventSources[2]);
                    event.handled = true;
                }
            });
        }
    });

    AFRAME.registerComponent('timer-face', {
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
                    if (altspace.inClient) {
                        point = event.detail.point;
                    }
                    el.object3D.worldToLocal(point);

                    //this is utter craziness and just reflects that i don't understand rotation etc
                    //but it does work!
                    if (altspace.inClient) {
                        newPoint = {x: point.y, y: point.z};
                    } else {
                        newPoint = {x: point.x, y: point.z};
                    }

                    var data = markers.toInstrumentAndCount(newPoint.x, newPoint.y);
                    if (data.instrumentNumber > -1 && data.instrumentNumber < instruments.instruments.length) {
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
                event.handled = true;
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

    AFRAME.registerComponent('timer-hand', {
        init: function () {
            var self = this;
            var el = this.el;
            scheduler.addEventListener("time", function (count) {
                var degreesPerSeg = ((360 / scoreLoader.score.beats)) / soundSettings.segmentsPerBeat;
                var currentDegrees = count * degreesPerSeg;
                el.setAttribute("rotation", "-90 -" + currentDegrees + " 0");
                //console.log(el.getAttribute("rotation"));
            });
        }
    });
}