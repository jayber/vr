function PedestalComponents(eventDispatcher, scheduler, soundSettings, markers, scoreLoader, animations) {

    AFRAME.registerComponent('reset', {
        init: function () {
            this.el.addEventListener("click", function () {
                eventDispatcher.reload();
            });
        }
    });

    AFRAME.registerComponent('double-up', {
        init: function () {
            this.el.addEventListener("click", function () {
                if (scoreLoader.score.beats < 16) {
                    eventDispatcher.doubleUp();
                }
            });
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
                    if (!altspace.outside) {
                        point = event.detail.point;
                    }
                    el.object3D.worldToLocal(point);

                    //this is utter craziness and just reflects that i don't understand rotation etc
                    //but it does work!
                    if (!altspace.outside) {
                        newPoint = {x: point.y, y: point.z};
                    } else {
                        newPoint = {x: point.x, y: point.z};
                    }

                    var data = markers.toInstrumentAndCount(newPoint.x, newPoint.y);
                    if (data.instrumentNumber > -1) {
                        eventDispatcher.addPlayTrigger(data, eventDispatcher);
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
            scoreLoader.score.addEventListener("bpm-change", function (event) {
                el.setAttribute("n-text", {text: event + " BPM", fontSize: "1pt"});
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


function AnimationManager(scheduler, settings) {
    var flashers = {};
    var self = this;
    var isDisco;
    var colors = [];
    var currentColor = 0;
    var mode2 = false;
    var discoColors;

    var animationsOn = !isGearVR();

    scheduler.addEventListener("beat", function (count) {
        if (animationsOn) {
            if (isDisco) {
                if (count != 0 && Math.floor((count / settings.segmentsPerBeat) % 8) == 0) {
                    mode2 = !mode2;
                }
                if (mode2) {
                    currentColor = (currentColor + 1) % colors.length;
                    var i = colors.length - 1;
                    discoColors = {};
                    Object.keys(flashers).forEach(function (key) {
                        discoColors[key] = (i + currentColor) % colors.length;
                        changeColor(colors[discoColors[key]], flashers[key].elements);
                        i--;
                    })
                }
            }
        }
    });

    function resetColors() {
        Object.keys(flashers).forEach(function (key) {
            changeColor(flashers[key].color, flashers[key].elements);
        });
        self.discoButton.setAttribute('material', 'color', '#fff');
    }

    Object.defineProperty(self, 'discoMode', {
        set: function (value) {
            isDisco = value;
            if (animationsOn) {
                if (!isDisco) {
                    resetColors();
                } else {
                    self.discoButton.setAttribute('material', 'color', '#0f0');
                }
            }
        }, get: function () {
            return isDisco;
        }
    });

    Object.defineProperty(self, 'animations', {
        get: function () {
            return animationsOn;
        }
    });

    self.toggleAnimations = function () {
        animationsOn = !animationsOn;
        if (!animationsOn) {
            resetColors();
        }
    };

    self.registerSlaveFlasher = function (name, element) {
        var namedFlashers = flashers[name];
        if (namedFlashers) {
            namedFlashers.elements.push(element);
        } else {
            throw "No master flasher for \"" + name + "\"";
        }
    };

    self.registerMasterFlasher = function (name, color, element) {
        var namedFlashers = flashers[name];
        colors.push(color);
        if (!namedFlashers) {
            namedFlashers = {color: color, elements: []};
            flashers[name] = namedFlashers;
        }
        namedFlashers.elements.push(element);
    };

    self.flash = function (name) {
        if (animationsOn) {
            var namedFlashers = flashers[name];
            changeColor("#fff", namedFlashers.elements);
        }
    };

    self.unflash = function (name) {
        if (animationsOn) {
            var namedFlashers = flashers[name];
            if (self.discoMode) {
                Object.keys(flashers).forEach(function (key) {
                    var color;
                    if (mode2) {
                        color = colors[discoColors[key]];
                    } else {
                        color = namedFlashers.color
                    }
                    changeColor(color, flashers[key].elements);
                    if (self.discoButton) {
                        self.discoButton.setAttribute('material', 'color', color);
                    }
                })
            } else {
                changeColor(namedFlashers.color, namedFlashers.elements);
            }
        }
    };

    function changeColor(color, elements) {
        if (elements) {
            elements.forEach(function (target) {
                target.setAttribute('material', 'color', color);
            });
        }
    }
}
