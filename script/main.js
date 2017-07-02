(function () {
    serverLog("referrer: " + document.referrer + "; userAgent: " + navigator.userAgent + "; isGear: " + isGearVR());

    altspace.open(getFullUrl("comment.html"), "_experience", {icon: getFullUrl("img/bugform.png"), hidden: true});

    var blUserPromise = altspace.getUser().then(function (user) {
        return new BLUser(user);
    });

    var sceneLoaded = makeSceneLoadedPromise();
    var soundSettings = new SoundSettings();
    var scoreLoader = new ScoreLoader(soundSettings);
    var eventDispatcher = new EventDispatcher(scoreLoader, sceneLoaded, blUserPromise);
    var scheduler = new AudioAndAnimationScheduler(soundSettings);
    var markers = new Markers(eventDispatcher, scoreLoader);
    var instruments = new Instruments(scoreLoader, eventDispatcher, markers);
    var animations = new AnimationManager(scheduler, soundSettings, eventDispatcher, scoreLoader);
    InstrumentComponents(instruments, scoreLoader, markers, soundSettings, scheduler, animations, sceneLoaded);
    PedestalComponents(eventDispatcher, scheduler, soundSettings, markers, scoreLoader, animations, blUserPromise, instruments);
    CockpitComponents(soundSettings, animations);

    eventDispatcher.addEventListener("reload", function (data) {
        scheduler.stop();
        scoreLoader.reload(data.index);
        return scoreLoader.loaded.then(function () {
            instruments.reload();
        })
    });

    eventDispatcher.addEventListener("freeForAllOn", function () {
        blUserPromise.then(function (user) {
            user.setFreeForAll(true);
        });
    });

    eventDispatcher.addEventListener("freeForAllOff", function () {
        blUserPromise.then(function (user) {
            user.setFreeForAll(false);
        });
    });

    eventDispatcher.addEventListener("moderatorAbsent", function () {
        blUserPromise.then(function (user) {
            user.moderatorPresent = false;
        });
    });

    eventDispatcher.addEventListener("moderatorPresent", function () {
        blUserPromise.then(function (user) {
            user.moderatorPresent = true;
        });
    });

    eventDispatcher.addEventListener("modOnlyOff", function () {
        blUserPromise.then(function (user) {
            user.modOnly = false;
        });
    });

    eventDispatcher.addEventListener("modOnlyOn", function () {
        blUserPromise.then(function (user) {
            user.modOnly = true;
        });
    });

    eventDispatcher.addEventListener("clear", function () {
        scoreLoader.score.clear();
        instruments.reload();
    });

    eventDispatcher.addEventListener("doubleUp", function () {
        scoreLoader.score.doubleUp();
        instruments.reload();
    });

    eventDispatcher.addEventListener("incrementBpm", function () {
        scheduler.stop();
        scoreLoader.score.bpm = scoreLoader.score.getDisplayBpm() + 1;
    });

    eventDispatcher.addEventListener("decrementBpm", function () {
        scheduler.stop();
        scoreLoader.score.bpm = scoreLoader.score.getDisplayBpm() - 1;
    });

    eventDispatcher.addEventListener("stop", function () {
        scheduler.stop();
    });

    eventDispatcher.addEventListener("start", function () {
        return scoreLoader.loaded.then(function () {
            var element = document.querySelector("#instruction");
            element.parentNode.removeChild(element);
            scheduler.start(scoreLoader.score);
        });
    });

})();