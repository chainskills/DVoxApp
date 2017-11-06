App = {
    web3Provider: null,
    contracts: {},
    account: 0x0,
    loading: false,
    speakerRow: 0,

    init: function () {
        return App.initWeb3();
    },

    initWeb3: function () {
        // Initialize web3 and set the provider to the testRPC.
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            // set the provider you want from Web3.providers
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
            web3 = new Web3(App.web3Provider);
        }

        // initialize the date picker
        $('#talk_starttime_picker').datetimepicker({
            format: 'DD/MM/YYYY HH:mm'
        });
        $('#talk_endtime_picker').datetimepicker({
            format: 'DD/MM/YYYY HH:mm'
        });


        App.displayAccountInfo();
        return App.initContract();
    },

    displayAccountInfo: function () {
        web3.eth.getCoinbase(function (err, account) {
            if (err === null) {
                App.account = account;
                $("#account").text(account);
                web3.eth.getBalance(account, function (err, balance) {
                    if (err === null) {
                        $("#accountBalance").text(web3.fromWei(balance, "ether") + " ETH");
                    }
                });
            }
        });
    },

    initContract: function () {
        $.getJSON('Conference.json', function (conferenceArtifact) {
            // Get the necessary contract artifact file and use it to instantiate a truffle contract abstraction.
            App.contracts.Conference = TruffleContract(conferenceArtifact);

            // Set the provider for our contract.
            App.contracts.Conference.setProvider(App.web3Provider);

            // Listen for events
            App.listenToEvents();

            // Retrieve the talks from the smart contract
            return App.reloadTalks();
        });
    },

    reloadTalks: function () {
        // avoid reentry
        if (App.loading) {
            return;
        }
        App.loading = true;

        // refresh account information because the balance may have changed
        App.displayAccountInfo();

        var conferenceInstance;
        App.contracts.Conference.deployed().then(function (instance) {
            conferenceInstance = instance;
            return conferenceInstance.getTalks(false);
        }).then(function (talkIds) {
            // Retrieve and clear the talk placeholder
            var talksRow = $('#talksRow');
            talksRow.empty();

            for (var i = 0; i < talkIds.length; i++) {
                var talkId = talkIds[i];
                conferenceInstance.getTalk(talkId.toNumber()).then(function (talk) {
                    // display the talk without the speaker addresses
                    App.displayTalk(
                        talk[0],
                        talk[1],
                        talk[2],
                        talk[3],
                        talk[5]
                    );
                });
            }
            App.loading = false;
        }).catch(function (err) {
            console.log(err.message);
            App.loading = false;
        });
    },


    displayTalk: function (_title, _location, _startTime, _endTime, _speakerNames) {
        // Retrieve the talk placeholder
        var talksRow = $('#talksRow');

        var startTime = new Date(_startTime * 1000).toLocaleString();
        var endTime = new Date(_endTime * 1000).toLocaleString();

        // Retrieve and fill the talk template
        var talkTemplate = $('#talkTemplate');
        talkTemplate.find('.panel-title').text(_title);
        talkTemplate.find('.title-location').text(_location);
        talkTemplate.find('.talk-startTime').text(startTime);
        talkTemplate.find('.talk-endTime').text(endTime);
        talkTemplate.find('.talk-speakers').text(_speakerNames.map(function(name){return web3.toAscii(name)}).join(', '));

        // add this talk
        talksRow.append(talkTemplate.html());
    },


    addTalk: function () {

        // retrieve details of the talk
        var _title = $("#talk_title").val();
        var _location = $("#talk_location").val();

        if ((_title.trim() == '') || (_location.trim() == '')) {
            // nothing to add
            return false;
        }

        var inputDateTime = $("#talk_starttime").val();
        var _startTime = moment(inputDateTime, 'DD-MM-YYYY HH:mm').toDate().getTime() / 1000;

        inputDateTime = $("#talk_endtime").val();
        var _endTime = moment(inputDateTime, 'DD-MM-YYYY HH:mm').toDate().getTime() / 1000;


        var speakerAccounts = document.getElementsByName('speakerAccounts[]');
        var speakerNames = document.getElementsByName('speakerNames[]');

        var _speakerAddress = [];
        var _speakerNames = [];
        for (var i = 0; i < speakerAccounts.length; i++) {
            if (speakerAccounts[i].value.trim().length > 0) {
                _speakerAddress.push(speakerAccounts[i].value);
                _speakerNames.push(web3.fromAscii(speakerNames[i].value));
            }
        }

        App.contracts.Conference.deployed().then(function (instance) {
            return instance.addTalk(
                _title,
                _location,
                _startTime,
                _endTime,
                _speakerAddress,
                _speakerNames, {
                    from: App.account,
                    gas: 500000
                });
        }).then(function (result) {

        }).catch(function (err) {
            console.error(err);
        });
    },


    addSpeaker: function () {

        App.speakerRow++;

        var divSpeakers = document.getElementById('speakers')
        var divNewSpeaker = document.createElement("div");
        divNewSpeaker.setAttribute("class", "form-group removeclass" + App.speakerRow);

        var newSpeaker = '<div class="col-sm-6 nopadding">' +
            '                                    <div class="form-group">' +
            '                                        <input type="text" class="form-control" id="speakerAccount"' +
            '                                               name="speakerAccounts[]" value="" placeholder="Speaker address">' +
            '                                    </div>' +
            '                                </div>' +
            '                                <div class="col-sm-6 nopadding">' +
            '                                    <div class="form-group">' +
            '                                        <div class="input-group">' +
            '                                            <input type="text" class="form-control" id="speakerName"' +
            '                                                   name="speakerNames[]" value="" placeholder="Speaker full name">' +
            '                                            <div class="input-group-btn">' +
            '                                                <button class="btn btn-danger" type="button"' +
            '                                                        onclick="App.speakerLine(' + App.speakerRow + '); return false"><span' +
            '                                                        class="glyphicon glyphicon-minus" aria-hidden="true"></span>' +
            '                                                </button>' +
            '                                            </div>' +
            '                                        </div>' +
            '                                    </div>' +
            '' +
            '                                </div>';

        divNewSpeaker.innerHTML = newSpeaker;

        divSpeakers.appendChild(divNewSpeaker);
    },

    speakerLine: function (speakerId) {
        $('.removeclass' + speakerId).remove();
    },


    // Listen for events raised from the contract
    listenToEvents: function () {
        App.contracts.Conference.deployed().then(function (instance) {
            instance.AddTalkEvent({}).watch(function (error, event) {
                if (!error) {
                    var startTime = new Date(event.args._startTime * 1000).toLocaleString();
                    var endTime = new Date(event.args._endTime * 1000).toLocaleString();

                    $("#events").append('<li class="list-group-item">' +
                        event.args._title + ' [' + event.args._id + '] ' +
                        'scheduled from ' + startTime + ' to ' + endTime + '</li>');
                } else {
                    console.error(error);
                }
                App.reloadTalks();
            });
        });
    },
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});