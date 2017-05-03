function reportException(e) {
    var data;
    altspace.getUser().then(function (user) {
        try {
            if (e.error) {
                data = {userId: user.userId + ":" + user.displayName, message: e.error.message, stack: e.error.stack};
            } else if (e.message) {
                data = {userId: user.userId + ":" + user.displayName, message: e.message, stack: ""};
            } else {
                e.userId = user.userId + "-" + user.displayName;
                data = JSON.stringify(e);
            }
            $.get("error", data);
        } catch (e) {
        }
    });
}

function serverLog(message) {
    altspace.getUser().then(function (user) {
        $.get("log", {userId: user.userId + ":" + user.displayName, message: message});
    });
}

function makeSceneLoadedPromise() {
    return new Promise(function (resolve, reject) {
        $(function () {
            var sceneEl = document.querySelector("a-scene");
            if (sceneEl.hasLoaded) {
                resolve(sceneEl);
            } else {
                sceneEl.addEventListener("loaded", function () {
                    resolve(sceneEl);
                });
            }
        });
    });
}

window.addEventListener('error', function (e) {
    reportException(e);
});

function isGearVR() {
    return /.+Mobile.+/i.test(navigator.userAgent);
}

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}
