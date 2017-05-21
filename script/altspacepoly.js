if (!altspace.inClient) {
    console.log("polyfilling altspace");
    var user = {userId: new Date().getTime(), displayName: "web-user", isModerator: true};
    altspace = {
        getUser: function () {
            return new Promise(function (resolve, reject) {
                resolve(user);
            });
        },
        getSpace: function () {
            return new Promise(function (resolve, reject) {
                resolve({sid: "web-space"});
            })
        },
        addNativeComponent: function () {
        },
        updateNativeComponent: function () {
        },
        open: function () {
        }
    };
}