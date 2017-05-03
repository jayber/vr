

(function () {
    serverLog("userAgent: " + navigator.userAgent + "; isGear: " + isGearVR());

    var sceneLoaded = makeSceneLoadedPromise();
    var soundSettings = new SoundSettings();
    var scoreLoader = new ScoreLoader(soundSettings);
    var scheduler = new AudioAndAnimationScheduler(soundSettings);
    var instruments = new Instruments(scoreLoader);
    var animations = new AnimationManager(scheduler, soundSettings);
    var eventDispatcher = new EventDispatcher(scheduler, instruments, scoreLoader, animations);
    var markers = new Markers(eventDispatcher, scoreLoader);
    InstrumentComponents(instruments, scoreLoader, markers, soundSettings, scheduler, animations, sceneLoaded);
    PedestalComponents(eventDispatcher, scheduler, soundSettings, markers, scoreLoader, animations);
    CockpitComponents(soundSettings, animations);
})();