if (!altspace.inClient) {
    console.log("polyfilling altspace");
    altspace = {
        getUser: function () {
            return new Promise(function (resolve, reject) {
                resolve({userId: new Date().getTime(), displayName: "web-user"});
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
        }
    };
}