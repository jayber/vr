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

function getFullUrl(path) {
    var currPath = location.pathname;
    if (!currPath.endsWith('/')) {
        currPath = location.pathname.split('/').slice(0, -1).join('/') + '/';
    }
    return location.origin + currPath + path;
}

function sendComment() {
    var spaceId = altspace.getSpace().then(function (space) {
        return space.sid;
    });
    var userId = altspace.getUser().then(function (user) {
        return user.userId;
    });
    var displayName = altspace.getUser().then(function (user) {
        return user.displayName;
    });
    Promise.all([spaceId, userId, displayName]).then(function (values) {
        var email = document.querySelector("#email").value;
        var messageElement = document.querySelector("#message");
        var message = messageElement.value;
        if (message.length > 0) {
            $.post("/savecomment/" + values[0] + "/" + values[1] + ":" + values[2],
                {email: email, message: message}
            ).done(function () {
                    $("#done").show();
                    $("#form").hide();
                }).fail(function () {
                    $("#fail").show();
                    $("#form").hide();
                });
        } else {
            $(messageElement).addClass("error");
        }
    });
}

