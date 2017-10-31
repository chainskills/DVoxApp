pragma solidity ^0.4.15;

import "./Ownable.sol";

contract Conference is Ownable {
    // Custom types
    struct Talk {
        uint id;
        string title;
        string location;
        uint startTime;
        uint endTime;
        bool canceled;
        address[] speakers;
    }

    struct Speaker {
        address account;
        bytes32 fullName;
        uint[] talksId;
    }

    struct Attendee {
        address account;
        string fullName;
    }


    // State variables
    mapping (uint => Talk) public talks;
    mapping (address => Speaker) public speakers;
    uint totalTalks;

    mapping (address => Attendee) public attendees;

    // constants
    uint256 constant REGISTRATION_PRICE = 1800000000000000000;

    // Events
    event AddTalkEvent(uint indexed _id, string _title, uint _startTime, uint _endTime);
    event CancelTalkEvent(uint indexed _id, string _title, uint _startTime, uint _endTime);
    event RegisterEvent(address indexed _account, string _name);


    /*
         Talks

         All functions used to manage talks.
    */


    // add an talk
    // trigger an event if the talk has been added
    function addTalk(
        string _title,
        string _location,
        uint _startTime,
        uint _endTime,
        address[] _speakersAddress,
        bytes32[] _speakersNames
        ) public onlyOwner {

        // check required fields
        require(bytes(_title).length > 0);
        require(_startTime > 0);
        require(_endTime > _startTime);
        require(_speakersAddress.length > 0);

        // a new talk
        totalTalks++;

        // store this talk
        talks[totalTalks].id = totalTalks;
        talks[totalTalks].title = _title;
        talks[totalTalks].location = _location;
        talks[totalTalks].startTime = _startTime;
        talks[totalTalks].endTime = _endTime;

        // store the speakers
        for (uint i = 0; i < _speakersAddress.length; i++) {
            // add or update the speaker details
            require(_speakersAddress[i] != 0);

            speakers[_speakersAddress[i]].account = _speakersAddress[i];
            speakers[_speakersAddress[i]].fullName = _speakersNames[i];
            speakers[_speakersAddress[i]].talksId.push(totalTalks);

            talks[totalTalks].speakers.push(_speakersAddress[i]);
        }

        // trigger the event
        AddTalkEvent(totalTalks, _title, _startTime, _endTime);
    }

    // cancel a talk
    // trigger an event if the talk has been canceled
    function cancelTalk(uint _talkId) public onlyOwner {
        // ensure that we have one talk related to this ID
        require(bytes(talks[_talkId].title).length > 0);

        // cancel the talk
        talks[_talkId].canceled = true;

        // trigger the event
        CancelTalkEvent(_talkId, talks[_talkId].title, talks[_talkId].startTime, talks[_talkId].endTime);
    }

    // check if a talk is canceled
    // returns true if the talk is canceled
    function isTalkCanceled(uint _talkId) public constant returns (bool) {
        return talks[_talkId].canceled;
    }

    // returns the number of talks (active and canceled)
    function getNumberOfTalks() public constant returns (uint) {
        return totalTalks;
    }

    // get an active talk and its speakers based on the Talk ID
    function getTalk(uint _talkId) public constant returns (
        string _title,
        string _location,
        uint _startTime,
        uint _endTime,
        address[] _speakersAddress,
        bytes32[] _speakersNames) {


        // ensure that we have one talk related to this ID
        require(bytes(talks[_talkId].title).length > 0);

        // keep only active talks
        require(talks[_talkId].canceled == false);

        // fetch the talk
        Talk memory talk = talks[_talkId];

        // prepare the list of speakers
        address[] memory speakersAddress = new address[](talk.speakers.length);
        bytes32[] memory speakersNames = new bytes32[](talk.speakers.length);

        // retrieve the list of speakers
        for (uint i = 0; i < talk.speakers.length; i++) {
            Speaker memory speaker = speakers[talk.speakers[i]];

            speakersAddress[i] = speaker.account;
            speakersNames[i] = speaker.fullName;
        }

        return (talk.title, talk.location, talk.startTime, talk.endTime, speakersAddress, speakersNames);
    }

    // fetch the list of talks
    // returns an array of talk ID
    // if onlyCanceled is true, we retrieve only canceled talks
    function getTalks(bool onlyCanceled) public constant returns (uint[] _talksId) {
        // we check whether there is at least one talk
        require(totalTalks > 0);

        // prepare the list of talks
        uint[] memory allTalkIds = new uint[](totalTalks);

        // retrieve the list of talks
        uint numberOfTalks = 0;
        for (uint i = 1; i <= totalTalks; i++) {
            if (talks[i].canceled == onlyCanceled) {
                allTalkIds[numberOfTalks] = i;
                numberOfTalks ++;
            }
        }

        // any talks?
        if (numberOfTalks == totalTalks) {
            // no canceled talks
            return allTalkIds;
        }

        // shrink the array by removing gaps
        uint[] memory talkIds = new uint[](numberOfTalks);

        for (i = 0; i < numberOfTalks; i++) {
            talkIds[i] = allTalkIds[i];
        }

        return talkIds;
    }

    // get all talks given by a speaker identified by its address
    // returns a list of talk ID
    function getTalksPerSpeaker(address _speakerAddress) public constant returns (uint[] _talksId) {

        require(_speakerAddress != 0x0);

        // fetch the speaker
        Speaker memory speaker = speakers[_speakerAddress];
        require(speaker.account != 0x0);

        // prepare the list of talks
        uint[] memory allTalkIds = new uint[](speaker.talksId.length);

        // retrieve the list of talks
        uint numberOfTalks = 0;
        for (uint i = 0; i < speaker.talksId.length; i++) {
            // keep only active talks
            if (talks[speaker.talksId[i]].canceled == false) {
                allTalkIds[numberOfTalks] = speaker.talksId[i];
                numberOfTalks ++;
            }
        }

        // any talks?
        if (numberOfTalks == totalTalks) {
            // no canceled talks
            return allTalkIds;
        }

        // shrink the array by removing gaps
        uint[] memory talkIds = new uint[](numberOfTalks);

        for (i = 0; i < numberOfTalks; i++) {
            talkIds[i] = allTalkIds[i];
        }

        return talkIds;
    }



    /*
     Attendees

     All functions used to manage attendees.
    */

    // register an attendee to the conference
    function register(string _fullName) public payable {

        // check required fields
        require(msg.value == REGISTRATION_PRICE);

        // not already registered
        require(attendees[msg.sender].account == 0x0);

        attendees[msg.sender] = Attendee(msg.sender, _fullName);

        // trigger the event
        RegisterEvent(msg.sender, _fullName);
    }

    // check if an attendee is registered
    // returns true if the attendee is registered
    function isRegistered(address _account) public constant returns (bool) {
        Attendee memory attendee = attendees[_account];
        if (attendee.account == 0x0) {
            return false;
        }

        return true;
    }
}