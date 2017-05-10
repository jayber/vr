if (!altspace.inClient) {
    console.log("polyfilling altspace");
    altspace = {
        getUser: function () {
            return new Promise(function (resolve, reject) {
                resolve({userId: new Date().getTime(), displayName: "web-user", isModerator: true});
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
        stubbed: true,
        open: function () {
        }
    };
}