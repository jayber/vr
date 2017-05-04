if (!altspace.inClient) {
    console.log("polyfilling altspace");
    altspace = {
        getUser: function () {
            return new Promise(function (resolve, reject) {
                resolve({userId: "1111", displayName: "web-user"});
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
        outside: true
    };
}