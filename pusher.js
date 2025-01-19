const Pusher = require('pusher');

const pusher = new Pusher({
    appId : "1928018",
    key : "ad5eaea9bc88a024a621",
    secret : "7e9182749da9f009f9d8",
    cluster : "ap1",
    useTLS: true,
});

module.exports = pusher;
