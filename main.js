const { Router } = require('express');
const { join } = require('path');

const Paths = {
    sdkPath: join(__dirname, 'sdk.js'),
    sdkURL: 'my-awesome-plugin/sdk.js',
};


module.exports = {

    router: null,

    load () {
        this.hookPreviewServer();
    },

    unload () {
        this.unhookPreviewServer();
    },

    insertSDK (settings) {
        let url = Paths.sdkURL;
        let newSettings = settings.replace(/,\s*jsList\s*:\s*\[/, '$&' + JSON.stringify(url) + ', ');
        if (newSettings === settings) {
            Editor.warn('Failed to send My Awesome SDK to the web preview.');
        }
        return newSettings;
    },

    getSettings (req, res, next) {
        let sendVendor = res.send;
        res.send = (content) => {
            content = this.insertSDK(content);
            sendVendor.call(res, content);
        };
        next();
    },

    getSDK (req, res) {
        res.sendFile(Paths.sdkPath);
    },

    hookPreviewServer () {
        if (this.router) {
            return;
        }
        this.router = Router();
        Editor.PreviewServer.userMiddlewares.push(this.router);

        this.router.get('/settings.js', this.getSettings.bind(this));
        this.router.get('/res/raw-' + Paths.sdkURL, this.getSDK.bind(this));
    },

    unhookPreviewServer () {
        cc.js.array.remove(Editor.PreviewServer.userMiddlewares, this.router);
        this.router = null;
    },
};
