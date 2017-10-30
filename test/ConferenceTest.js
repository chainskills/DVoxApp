// contract to be tested
var conference = artifacts.require("./conference.sol");

// Test suite
contract('Conference', function (accounts) {
    var contractInstance;
    var registrationPrice = 1.8;
    var owner = accounts[0];
    var talk1_Title = "Talk 1";
    var talk1_Location = "Room 1";
    var talk1_StartTime = new Date('11/07/2017 09:30').getTime();
    var talk1_EndTime = new Date('11/07/2017 12:30').getTime();
    var talk2_Title = "Talk 2";
    var talk2_Location = "Room 2";
    var talk2_StartTime = new Date('11/07/2017 09:30').getTime();
    var talk2_EndTime = new Date('11/07/2017 12:30').getTime();
    var talk3_Title = "Talk 3";
    var talk3_Location = "Room 3";
    var talk3_StartTime = new Date('11/07/2017 13:30').getTime();
    var talk3_EndTime = new Date('11/07/2017 16:30').getTime();
    var speaker1_account = accounts[1];
    var speaker1_fullName = "John Doe";
    var speaker2_account = accounts[2];
    var speaker2_fullName = "Claire Smith";
    var attendee1 = accounts[3];
    var attendeed1_FullName = "Rick Deckard";
    var attendee2 = accounts[4];
    var attendeed2_FullName = "Niander Wallace";
    var balanceAttendeeBefore, balanceAttendeeAfter;
    var balanceContractBefore, balanceContractAfter;


    it("should be initialized with empty values", function() {
        return conference.deployed().then(function(instance) {
            contractInstance = instance;
            return contractInstance.getNumberOfTalks();
        }).then(function(data) {
            assert.equal(data, 0x0, "number of talks must be zero");
        });
    });

    it("should let us add a first talk", function() {
        return conference.deployed().then(function(instance) {
            contractInstance = instance;

            var speakersAddress = [];
            speakersAddress.push(speaker1_account);
            speakersAddress.push(speaker2_account);

            var speakersNames = [];
            speakersNames.push(speaker1_fullName);
            speakersNames.push(speaker2_fullName);

            return contractInstance.addTalk(
                talk1_Title,
                talk1_Location,
                talk1_StartTime,
                talk1_EndTime,
                speakersAddress,
                speakersNames, {
                    from: owner
                });
        }).then(function(receipt) {
            //check event
            assert.equal(receipt.logs.length, 1, "should have received one event");
            assert.equal(receipt.logs[0].event, "AddTalkEvent", "event name should be AddTalkEvent");
            assert.equal(receipt.logs[0].args._id.toNumber(), 1, "position must be 1");
            assert.equal(receipt.logs[0].args._title, talk1_Title, "title must be " + talk1_Title);
            assert.equal(receipt.logs[0].args._startTime.toNumber(), talk1_StartTime, "start time name must be " + talk1_StartTime);
            assert.equal(receipt.logs[0].args._endTime.toNumber(), talk1_EndTime, "end time name must be " + talk1_EndTime);

            return contractInstance.getNumberOfTalks.call();
        }).then(function(data) {
            assert.equal(data, 1, "number of talks must be one");

            return contractInstance.getTalk(1);
        }).then(function(data) {

            assert.equal(data[4].length, 2, "should have received two speakers");

            assert.equal(data[0], talk1_Title, "title must be " + talk1_Title);
            assert.equal(data[1], talk1_Location, "location must be " + talk1_Location);
            assert.equal(data[2].toNumber(), talk1_StartTime, "start time name must be " + talk1_StartTime);
            assert.equal(data[3].toNumber(), talk1_EndTime, "end time name must be " + talk1_EndTime);

            assert.equal(data[4][0], speaker1_account, "speaker 1 account must be " + speaker1_account);
            assert.equal(web3.toAscii(data[5][0].replace(/[0]+$/, '')), speaker1_fullName, "speaker 1 full name must be " + speaker1_fullName);

            assert.equal(data[4][1], speaker2_account, "speaker 2 account must be " + speaker2_account);
            assert.equal(web3.toAscii(data[5][1].replace(/[0]+$/, '')), speaker2_fullName, "speaker 2 full name must be " + speaker2_fullName);

            return contractInstance.getTalksPerSpeaker(speaker1_account);
        }).then(function(data) {

            assert.equal(data.length, 1, "should have only one talk");
            assert.equal(data[0], 1, "talk id must be one");

            return contractInstance.getTalksPerSpeaker(speaker2_account);
        }).then(function(data) {

            assert.equal(data.length, 1, "should have only one talk");
            assert.equal(data[0], 1, "talk id must be one");
        });
    });

    it("should let us add a second talk", function() {
        return conference.deployed().then(function(instance) {
            contractInstance = instance;

            var speakersAddress = [];
            speakersAddress.push(speaker2_account);

            var speakersNames = [];
            speakersNames.push(speaker2_fullName);

            return contractInstance.addTalk(
                talk2_Title,
                talk2_Location,
                talk2_StartTime,
                talk2_EndTime,
                speakersAddress,
                speakersNames, {
                    from: owner
                });
        }).then(function(receipt) {
            //check event
            assert.equal(receipt.logs.length, 1, "should have received one event");
            assert.equal(receipt.logs[0].event, "AddTalkEvent", "event name should be AddTalkEvent");
            assert.equal(receipt.logs[0].args._id.toNumber(), 2, "position must be 2");
            assert.equal(receipt.logs[0].args._title, talk2_Title, "title must be " + talk1_Title);
            assert.equal(receipt.logs[0].args._startTime.toNumber(), talk2_StartTime, "start time name must be " + talk2_StartTime);
            assert.equal(receipt.logs[0].args._endTime.toNumber(), talk2_EndTime, "end time name must be " + talk2_EndTime);

            return contractInstance.getNumberOfTalks();
        }).then(function(data) {
            assert.equal(data, 2, "number of talks must be two");

            return contractInstance.getTalk(2);
        }).then(function(data) {

            assert.equal(data[4].length, 1, "should have received one speaker");

            assert.equal(data[0], talk2_Title, "title must be " + talk2_Title);
            assert.equal(data[1], talk2_Location, "location must be " + talk2_Location);
            assert.equal(data[2].toNumber(), talk2_StartTime, "start time name must be " + talk2_StartTime);
            assert.equal(data[3].toNumber(), talk2_EndTime, "end time name must be " + talk2_EndTime);

            assert.equal(data[4][0], speaker2_account, "speaker account must be " + speaker2_account);
            assert.equal(web3.toAscii(data[5][0].replace(/[0]+$/, '')), speaker2_fullName, "speaker full name must be " + speaker2_fullName);

            return contractInstance.getTalksPerSpeaker(speaker2_account);
        }).then(function(data) {

            assert.equal(data.length, 2, "should have two talks");
            assert.equal(data[0], 1, "talk id must be one");
            assert.equal(data[1], 2, "talk id must be two");
        });
    });

    it("should let us add a third talk", function() {
        return conference.deployed().then(function(instance) {
            contractInstance = instance;

            var speakersAddress = [];
            speakersAddress.push(speaker1_account);

            var speakersNames = [];
            speakersNames.push(speaker1_fullName);

            return contractInstance.addTalk(
                talk3_Title,
                talk3_Location,
                talk3_StartTime,
                talk3_EndTime,
                speakersAddress,
                speakersNames, {
                    from: owner
                });
        }).then(function(receipt) {
            //check event
            assert.equal(receipt.logs.length, 1, "should have received one event");
            assert.equal(receipt.logs[0].event, "AddTalkEvent", "event name should be AddTalkEvent");
            assert.equal(receipt.logs[0].args._id.toNumber(), 3, "position must be 3");
            assert.equal(receipt.logs[0].args._title, talk3_Title, "title must be " + talk1_Title);
            assert.equal(receipt.logs[0].args._startTime.toNumber(), talk3_StartTime, "start time name must be " + talk3_StartTime);
            assert.equal(receipt.logs[0].args._endTime.toNumber(), talk3_EndTime, "end time name must be " + talk3_EndTime);

            return contractInstance.getNumberOfTalks();
        }).then(function(data) {
            assert.equal(data, 3, "number of talks must be three");

            return contractInstance.getTalk(3);
        }).then(function(data) {

            assert.equal(data[4].length, 1, "should have received one speaker");

            assert.equal(data[0], talk3_Title, "title must be " + talk3_Title);
            assert.equal(data[1], talk3_Location, "location must be " + talk3_Location);
            assert.equal(data[2].toNumber(), talk3_StartTime, "start time name must be " + talk3_StartTime);
            assert.equal(data[3].toNumber(), talk3_EndTime, "end time name must be " + talk3_EndTime);

            assert.equal(data[4][0], speaker1_account, "speaker 1 account must be " + speaker1_account);
            assert.equal(web3.toAscii(data[5][0].replace(/[0]+$/, '')), speaker1_fullName, "speaker full name must be " + speaker1_fullName);

            return contractInstance.getTalksPerSpeaker(speaker1_account);
        }).then(function(data) {

            assert.equal(data.length, 2, "should have two talks");
            assert.equal(data[0], 1, "talk id must be 1");
            assert.equal(data[1], 3, "talk id must be 3");
        });
    });

    it("should let us cancel the second talk", function() {
        return conference.deployed().then(function(instance) {
            contractInstance = instance;

            return contractInstance.cancelTalk(2);
        }).then(function(receipt) {
            //check event
            assert.equal(receipt.logs.length, 1, "should have received one event");
            assert.equal(receipt.logs[0].event, "CancelTalkEvent", "event name should be CancelTalkEvent");
            assert.equal(receipt.logs[0].args._id.toNumber(), 2, "position must be 2");
            assert.equal(receipt.logs[0].args._title, talk2_Title, "title must be " + talk2_Title);
            assert.equal(receipt.logs[0].args._startTime.toNumber(), talk2_StartTime, "start time name must be " + talk2_StartTime);
            assert.equal(receipt.logs[0].args._endTime.toNumber(), talk2_EndTime, "end time name must be " + talk2_EndTime);

            return contractInstance.isTalkCanceled(2);
        }).then(function(data) {
            assert.equal(data, true, "talk should be canceled");
            return contractInstance.getTalks(true);
        }).then(function(data) {
            assert.equal(data.length, 1, "one talk should be canceled");
            assert.equal(data[0].toNumber(), 2, "talk 2 should be canceled");
        });
    });

    it("should register a first attendee", function() {
        return conference.deployed().then(function(instance) {
            contractInstance = instance;

            balanceAttendeeBefore = web3.fromWei(web3.eth.getBalance(attendee1), "ether");
            balanceContractBefore = web3.fromWei(web3.eth.getBalance(conference.address), "ether");

            return contractInstance.register(attendeed1_FullName, {
                from: attendee1,
                value: web3.toWei(registrationPrice, "ether"),
                gas: 500000
            });
        }).then(function(receipt) {
            //check event
            assert.equal(receipt.logs.length, 1, "should have received one event");
            assert.equal(receipt.logs[0].event, "RegisterEvent", "event name should be RegisterEvent");
            assert.equal(receipt.logs[0].args._name, attendeed1_FullName, "full name must be " + attendeed1_FullName);

            return contractInstance.isRegistered(attendee1);
        }).then(function(data) {
            assert.equal(data, true, "attendee should be registered");

            balanceAttendeeAfter = web3.fromWei(web3.eth.getBalance(attendee1), "ether");
            balanceContractAfter = web3.fromWei(web3.eth.getBalance(conference.address), "ether");

            assert(web3.toDecimal(balanceContractAfter) == web3.toDecimal(balanceContractBefore + registrationPrice), "contract should have earned " + registrationPrice + " ETH")
            assert(web3.toDecimal(balanceAttendeeAfter) <= web3.toDecimal(balanceAttendeeBefore - registrationPrice), "attendee should have spent " + registrationPrice + " ETH")
        });
    });

    it("should register a second attendee", function() {
        return conference.deployed().then(function(instance) {
            contractInstance = instance;

            balanceAttendeeBefore = web3.fromWei(web3.eth.getBalance(attendee2), "ether");
            balanceContractBefore = web3.fromWei(web3.eth.getBalance(conference.address), "ether");

            return contractInstance.register(attendeed2_FullName, {
                from: attendee2,
                value: web3.toWei(registrationPrice, "ether"),
                gas: 500000
            });
        }).then(function(receipt) {
            //check event
            assert.equal(receipt.logs.length, 1, "should have received one event");
            assert.equal(receipt.logs[0].event, "RegisterEvent", "event name should be RegisterEvent");
            assert.equal(receipt.logs[0].args._name, attendeed2_FullName, "full name must be " + attendeed2_FullName);

            return contractInstance.isRegistered(attendee2);
        }).then(function(data) {
            assert.equal(data, true, "attendee should be registered");

            balanceAttendeeAfter = web3.fromWei(web3.eth.getBalance(attendee2), "ether");
            balanceContractAfter = web3.fromWei(web3.eth.getBalance(conference.address), "ether");

            assert(web3.toDecimal(balanceContractAfter) == web3.toDecimal(balanceContractBefore) + web3.toDecimal(registrationPrice), "contract should have earned " + registrationPrice + " ETH")
            assert(web3.toDecimal(balanceAttendeeAfter) <= web3.toDecimal(balanceAttendeeBefore) - web3.toDecimal(registrationPrice), "attendee should have spent " + registrationPrice + " ETH")
        });
    });
});

