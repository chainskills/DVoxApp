App = {
    web3Provider: null,
    contracts: {},
    account: 0x0,
    loading: false,
    speakerRow: 0,

    init: function() {
        return App.initWeb3();
    },

    initWeb3: function() {
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
        $('#talk_endtime').datetimepicker({
            format: 'DD/MM/YYYY HH:mm'
        });


        App.displayAccountInfo();
        return App.initContract();
    },

    displayAccountInfo: function() {
        web3.eth.getCoinbase(function(err, account) {
            if (err === null) {
                App.account = account;
                $("#account").text(account);
                web3.eth.getBalance(account, function(err, balance) {
                    if (err === null) {
                        $("#accountBalance").text(web3.fromWei(balance, "ether") + " ETH");
                    }
                });
            }
        });
    },

    initContract: function() {
        $.getJSON('Conference.json', function(conferenceArtifact) {
            // Get the necessary contract artifact file and use it to instantiate a truffle contract abstraction.
            App.contracts.Conference = TruffleContract(conferenceArtifact);

            // Set the provider for our contract.
            App.contracts.Conference.setProvider(App.web3Provider);

            // Listen for events
            App.listenToEvents();

            // Retrieve the article from the smart contract
            return App.reloadArticles();
        });
    },

    reloadTalks: function() {
        // avoid reentry
        if (App.loading) {
            return;
        }
        App.loading = true;

        // refresh account information because the balance may have changed
        App.displayAccountInfo();

        var conferenceInstance;

        App.contracts.Conference.deployed().then(function(instance) {
            conferenceInstance = instance;
            return conferenceInstance.getArticlesForSale();
        }).then(function(conferenceIds) {
            // Retrieve and clear the article placeholder
            var articlesRow = $('#articlesRow');
            articlesRow.empty();

            for (var i = 0; i < conferenceIds.length; i++) {
                var articleId = conferenceIds[i];
                conferenceInstance.articles(articleId.toNumber()).then(function(article) {
                    App.displayArticle(
                        article[0],
                        article[1],
                        article[3],
                        article[4],
                        article[5]
                    );
                });
            }
            App.loading = false;
        }).catch(function(err) {
            console.log(err.message);
            App.loading = false;
        });
    },

    displayArticle: function(id, seller, name, description, price) {
        // Retrieve the article placeholder
        var articlesRow = $('#articlesRow');

        var etherPrice = web3.fromWei(price, "ether");

        // Retrieve and fill the article template
        var articleTemplate = $('#articleTemplate');
        articleTemplate.find('.panel-title').text(name);
        articleTemplate.find('.article-description').text(description);
        articleTemplate.find('.article-price').text(etherPrice + " ETH");
        articleTemplate.find('.btn-buy').attr('data-id', id);
        articleTemplate.find('.btn-buy').attr('data-value', etherPrice);


        var rows = document.getElementsByName('categorySelect[]');
        var selectedRows = [];
        for (var i = 0, l = rows.length; i < l; i++) {
            if (rows[i].checked) {
                selectedRows.push(rows[i]);
            }
        }

        // seller?
        if (seller == App.account) {
            articleTemplate.find('.article-seller').text("You");
            articleTemplate.find('.btn-buy').hide();
        } else {
            articleTemplate.find('.article-seller').text(seller);
            articleTemplate.find('.btn-buy').show();
        }

        // add this new article
        articlesRow.append(articleTemplate.html());
    },


    addSpeaker: function() {

        App.speakerRow ++;

        var divSpeakers = document.getElementById('speakers')
        var divNewSpeaker = document.createElement("div");
        divNewSpeaker.setAttribute("class", "form-group removeclass" + App.speakerRow);

        var newSpeaker = '<div class="col-sm-6 nopadding">'+
            '                                    <div class="form-group">'+
            '                                        <input type="text" class="form-control" id="speakerAccount"'+
            '                                               name="speakerAccounts[]" value="" placeholder="Speaker address">'+
            '                                    </div>'+
            '                                </div>'+
            '                                <div class="col-sm-6 nopadding">'+
            '                                    <div class="form-group">'+
            '                                        <div class="input-group">'+
            '                                            <input type="text" class="form-control" id="speakerName"'+
            '                                                   name="speakerNames[]" value="" placeholder="Speaker full name">'+
            '                                            <div class="input-group-btn">'+
            '                                                <button class="btn btn-danger" type="button"'+
            '                                                        onclick="App.speakerLine(' + App.speakerRow + '); return false"><span'+
            '                                                        class="glyphicon glyphicon-minus" aria-hidden="true"></span>'+
            '                                                </button>'+
            '                                            </div>'+
            '                                        </div>'+
            '                                    </div>'+
            ''+
            '                                </div>';

        divNewSpeaker.innerHTML = newSpeaker;

        divSpeakers.appendChild(divNewSpeaker);
    },

    speakerLine: function(speakerId) {
        $('.removeclass'+ speakerId).remove();
    },

    sellArticle: function() {

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

        App.contracts.Conference.deployed().then(function(instance) {
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
        }).then(function(result) {

        }).catch(function(err) {
            console.error(err);
        });
    },

    // Listen for events raised from the contract
    listenToEvents: function() {
        App.contracts.Conference.deployed().then(function(instance) {
            instance.sellArticleEvent({}).watch(function(error, event) {
                if (!error) {
                    $("#events").append('<li class="list-group-item">' + event.args._name + ' is for sale' + '</li>');
                } else {
                    console.error(error);
                }
                App.reloadArticles();
            });
        });
    },

    buyArticle: function() {
        event.preventDefault();

        // retrieve the article price
        var _articleId = $(event.target).data('id');
        var _price = parseFloat($(event.target).data('value'));

        App.contracts.Conference.deployed().then(function(instance) {
            return instance.buyArticle(_articleId, {
                from: App.account,
                value: web3.toWei(_price, "ether"),
                gas: 500000
            });
        }).then(function(result) {

        }).catch(function(err) {
            console.error(err);
        });
    },
};

$(function() {
    $(window).load(function() {
        App.init();
    });
});