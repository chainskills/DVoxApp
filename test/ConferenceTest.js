// contract to be tested
var conference = artifacts.require("./Conference.sol");

// Test suite
contract('Conference', function (accounts) {
    var contractInstance;
    var registrationPrice = 1.8;
    var owner = accounts[0];
    var talkTitle = "Talk 1";
    var location = "Room 1";
    var startTime = new Date('11/07/2017 09:30').getTime() / 1000;
    var endTime = new Date('11/07/2017 12:30').getTime() / 1000;
    var speakerAccount = "0x45b23edabf54872331e9a9ea24e113a7a61265f5";
    var speakerFullName = "John Doe";
    var attendee = accounts[1];
    var attendeeFullName = "Rick Deckard";
    var balanceAttendeeBefore, balanceAttendeeAfter;
    var balanceContractBefore, balanceContractAfter;


    // Test case: check initial values
    it("should be initialized with empty values", function () {
        return conference.deployed().then(function (instance) {
            return instance.getTalk();
        }).then(function (data) {
            assert.equal(data[0], '', "talk name must be empty");
            assert.equal(data[1], '', "location must be empty");
            assert.equal(data[2].toNumber(), 0, "start time must be 0");
            assert.equal(data[3].toNumber(), 0, "end time must be 0");
            assert.equal(data[4], 0x0, "speaker address must be empty");
            assert.equal(data[5], '', "speaker name must be empty");
        });
    });

    // Test case: add a talk
    it("should add a talk", function () {
        return conference.deployed().then(function (instance) {
            contractInstance = instance;

            return contractInstance.addTalk(
                talkTitle,
                location,
                startTime,
                endTime,
                speakerAccount,
                speakerFullName, {
                    from: owner
                });
        }).then(function () {
            return contractInstance.getTalk();
        }).then(function (data) {
            assert.equal(data[0], talkTitle, "talk name must " + talkTitle);
            assert.equal(data[1], location, "location must be " + location);
            assert.equal(data[2].toNumber(), startTime, "start time must be " + startTime);
            assert.equal(data[3].toNumber(), endTime, "end time must be " + endTime);
            assert.equal(data[4], speakerAccount, "speaker address must be " + speakerAccount);
            assert.equal(data[5], speakerFullName, "speaker name must be " + speakerFullName);
        });
    });

    // Test case: should check events
    it("should trigger an event when a new talk is added", function () {
        return conference.deployed().then(function (instance) {
            contractInstance = instance;

            return contractInstance.addTalk(
                talkTitle,
                location,
                startTime,
                endTime,
                speakerAccount,
                speakerFullName, {
                    from: owner
                });
        }).then(function (receipt) {
            //check event
            assert.equal(receipt.logs.length, 1, "should have received one event");
            assert.equal(receipt.logs[0].event, "AddTalkEvent", "event name should be AddTalkEvent");
            assert.equal(receipt.logs[0].args._title, talkTitle, "title must be " + talkTitle);
            assert.equal(receipt.logs[0].args._startTime.toNumber(), startTime, "start time name must be " + startTime);
            assert.equal(receipt.logs[0].args._endTime.toNumber(), endTime, "end time name must be " + endTime);
        });
    });

    // Test case: register an attendee
    it("should register an attendee", function () {
        return conference.deployed().then(function (instance) {
            contractInstance = instance;

            balanceAttendeeBefore = web3.fromWei(web3.eth.getBalance(attendee), "ether");
            balanceContractBefore = web3.fromWei(web3.eth.getBalance(conference.address), "ether");

            return contractInstance.register(attendeeFullName, {
                from: attendee,
                value: web3.toWei(registrationPrice, "ether"),
                gas: 500000
            });
        }).then(function (receipt) {
            //check event
            assert.equal(receipt.logs.length, 1, "should have received one event");
            assert.equal(receipt.logs[0].event, "RegisterEvent", "event name should be RegisterEvent");
            assert.equal(receipt.logs[0].args._account, attendee, "full name must be " + attendee);
            assert.equal(receipt.logs[0].args._name, attendeeFullName, "full name must be " + attendeeFullName);

            return contractInstance.isRegistered(attendee);
        }).then(function (data) {
            assert.equal(data, true, "attendee should be registered");

            balanceAttendeeAfter = web3.fromWei(web3.eth.getBalance(attendee), "ether");
            balanceContractAfter = web3.fromWei(web3.eth.getBalance(conference.address), "ether");

            assert(web3.toDecimal(balanceContractAfter) == web3.toDecimal(balanceContractBefore + registrationPrice), "contract should have earned " + registrationPrice + " ETH")
            assert(web3.toDecimal(balanceAttendeeAfter) <= web3.toDecimal(balanceAttendeeBefore - registrationPrice), "attendee should have spent " + registrationPrice + " ETH")
        });
    });
});

