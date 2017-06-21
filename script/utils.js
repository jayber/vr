function reportException(e, line) {
    var data;
    altspace.getUser().then(function (user) {
        try {
            if (e.error) {
                data = {userId: user.userId + ":" + user.displayName, message: e.error.message, stack: e.error.stack};
            } else if (e.message) {
                data = {userId: user.userId + ":" + user.displayName, message: e.message, stack: line};
            } else {
                data = {userId: user.userId + ":" + user.displayName, message: e, stack: line};
            }
            $.get("error", data);
        } catch (e) {
            console.error("could not report error to server", e);
        }
    });
}

function serverLog(message) {
    altspace.getUser().then(function (user) {
        $.get("log", {userId: user.userId + ":" + user.displayName, message: message});
    });
}

window.addEventListener('error', function (e, url, line) {
    var stack = (url ? url : "") + ":" + (line ? line : "");
    reportException(e, stack);
});

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

function BLUser(user) {
    var self = this;
    var listeners = [];
    var ffa = false;
    var moderatorPresent = false;

    self.user = user;

    self.hasPermission = function () {
        return !moderatorPresent || (moderatorPresent && ffa) || user.isModerator;
    };

    self.permissionChanged = function (listener) {
        listeners.push(listener);
    };

    self.setFreeForAll = function (value) {
        if (ffa != value) {
            ffa = value;
            dispatchPermissionChanged();
        }
    };


    Object.defineProperty(self, 'moderatorPresent', {
        set: function (value) {
            moderatorPresent = value;
            dispatchPermissionChanged();
        }, get: function () {
            return moderatorPresent;
        }
    });

    self.isFreeForAll = function () {
        return ffa;
    };

    function dispatchPermissionChanged() {
        listeners.forEach(function (listener) {
            listener.call(self, self.hasPermission());
        })
    }
}