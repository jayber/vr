function AnimationManager(scheduler, settings, eventDispatcher, scoreLoader) {
    var flashers = {};
    var self = this;
    var isDisco;
    var colors = [];
    var currentColor = 0;
    var mode2 = false;
    var discoColors;

    var animationsOn = !isGearVR();

    scoreLoader.score.addEventListener("bpm-change", function (bpm) {
        if (bpm === 666) {
            settings.play("audio/satan.wav");
        }
    });

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

    eventDispatcher.addEventListener("toggleDiscoMode", function () {
        self.discoMode = !self.discoMode;
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
