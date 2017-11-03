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

    struct Vote {
        uint talkId;
        address attendee;
        uint rating;
        string comment;
    }


    // State variables
    mapping (uint => Talk) public talks;
    mapping (address => Speaker) public speakers;
    uint totalTalks;

    mapping (address => Attendee) public attendees;

    mapping (address => Vote[]) public allAttendeeVotes;
    mapping (uint => Vote[]) public allVotes;

    mapping (address => mapping(uint => bool)) public paidRewards;

    // constants
    uint256 constant REGISTRATION_PRICE = 1800000000000000000;

    // Events
    event AddTalkEvent(uint indexed _id, string _title, uint _startTime, uint _endTime);
    event CancelTalkEvent(uint indexed _id, string _title, uint _startTime, uint _endTime);
    event RegisterEvent(address indexed _account, string _name);
    event NewVoteEvent(uint indexed _talkId, address _attendee, uint _vote);
    event RewardEvent(address indexed _speaker, uint256 _reward);


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


    /*
     Votes

     All functions realted to the vote from attendees.
    */

    // check if a talk is open for votes
    // the grace time is +/- 15 minutes from the endTime
    // returns true if votes are open
    function isVoteOpen(uint _talkId) public constant returns (bool) {
        Talk memory talk = talks[_talkId];

        if (bytes(talks[_talkId].title).length == 0) {
            // do not exist
            return false;
        }

        if (talk.canceled) {
            // not active
            return false;
        }

        uint currentTime = now;
        if (currentTime < talk.startTime) {
            // talk not started
            return false;
        }

        // computer grace time (+/- 15 minutes from the end time)
        uint graceTime = currentTime;
        if (currentTime > talk.endTime) {
            graceTime = currentTime - talk.endTime;
        }
        else {
            graceTime = talk.endTime - currentTime;
        }

        if (graceTime <= (15 * 60)) {
            // vote is open
            return true;
        }
        else {
            return false;
        }
    }

    // check if a vote is closed for votes
    // the grace time msut be greater than 15 minutes from the endTime
    // returns true if votes are closed
    function isVoteClosed(uint _talkId) public constant returns (bool) {
        Talk memory talk = talks[_talkId];

        if (bytes(talks[_talkId].title).length == 0) {
            // do not exist
            return false;
        }

        if (talk.canceled) {
            // not active
            return false;
        }

        uint currentTime = now;
        if (currentTime < talk.startTime) {
            // talk not started
            return false;
        }

        // computer grace time (+/- 15 minutes from the end time)
        uint graceTime = currentTime;
        if (currentTime > talk.endTime) {
            graceTime = currentTime - talk.endTime;
        }
        else {
            graceTime = talk.endTime - currentTime;
        }

        if (graceTime > (15 * 60)) {
            // vote is open
            return true;
        }
        else {
            return false;
        }
    }

    // add a vote to a talk
    // trigger an event if the vote is taking into account
    function addVote(uint _talkId, uint _vote, string _comment) public {
        // ensure that the attendee is registered
        require(attendees[msg.sender].account != 0x0);

        // ensure that the vote is open for this talk
        require(isVoteOpen(_talkId) == true);

        // ensure that the vote is in the correct range
        require(_vote <= 5);

        // delete any vote for the same session
        Vote[] memory votesAttendee = allAttendeeVotes[msg.sender];
        for (uint i = 0; i < votesAttendee.length; i ++) {
            if (isVoteOpen(votesAttendee[i].talkId)) {
                // this talk is still open for a vote
                // -> delete the vote to replace with the new one

                // remove the vote linked to the attendee
                delete allAttendeeVotes[msg.sender][i];

                // remote the vote of this attendee
                Vote[] memory votes = allVotes[votesAttendee[i].talkId];
                for (uint j = 0; j < votes.length; j ++) {
                    if (votes[i].attendee == msg.sender) {
                        delete allVotes[votesAttendee[i].talkId][i];
                    }
                }
            }
        }

        // add the vote
        Vote memory vote = Vote(_talkId, msg.sender, _vote, _comment);
        allVotes[_talkId].push(vote);
        allAttendeeVotes[msg.sender].push(vote);

        NewVoteEvent(_talkId, msg.sender, _vote);
    }

    // get the ratings for a talk identified by its ID
    // returns the total ratings and the total of votes given to this talk
    function getRatings(uint _talkId) public constant returns (uint _totalRatings, uint _totalVotes) {
        // do we have some votes?
        Vote[] memory votes = allVotes[_talkId];

        if (votes.length == 0) {
            return;
        }

        uint totalRatings = 0;
        uint totalVotes = 0;
        for (uint i = 0; i < votes.length; i ++) {
            // skip deleted votes
            if (votes[i].attendee != 0x0) {
                totalRatings += votes[i].rating;
                totalVotes ++;
            }
        }

        return (totalRatings, totalVotes);
    }

    /*
         Rewards

         All functions realted to the rewards earnd by the speakers.
    */


    // let a speaker to withdraw the reward
    // a reward can be withdraw when the vote is closed
    // transfer the reward to the speaker and mark it as paid
    function withdrawReward() public {

        address speaker = msg.sender;

        // any talks for this potential speaker?
        require(speakers[speaker].account != 0x0);
        require(speakers[speaker].talksId.length > 0);

        // keep rewards
        uint256 rewards = 0;

        // retrieve ratings and votes for all talks given by the speaker
        for (uint i = 0; i < speakers[speaker].talksId.length; i ++) {
            uint talkId = speakers[speaker].talksId[i];

            // only for talks with votes closed and not already paid
            if (isVoteClosed(talkId) && (paidRewards[speaker][talkId] == false)) {
                Vote[] memory votes = allVotes[talkId];

                // process votes for the talks given by the speaker
                uint totalRatings = 0;
                uint totalVotes = 0;
                for (uint j = 0; j < votes.length; j ++) {
                    Vote memory vote = votes[j];

                    // skip deleted votes
                    if (vote.attendee != 0x0) {
                        totalRatings += vote.rating;
                        totalVotes ++;
                    }
                }

                // add the reward
                rewards += computeReward(totalRatings, totalVotes);

                paidRewards[speaker][talkId] = true;
            }
        }

        // any rewards to pay?
        if (rewards == 0) {
            return;
        }

        // reward the speaker
        speaker.transfer(rewards);

        // trigger the event
        RewardEvent(speaker, rewards);
    }


    // get the reward for a speaker identified by its address.
    // rewards are not computed for canceled talks
    // returns an array of rewards per talk
    function getRewards(address _speaker) public constant returns (uint[] _talksId, uint256[] _rewards) {

        // any talks for this potential speaker?
        require(speakers[_speaker].account != 0x0);
        require(speakers[_speaker].talksId.length > 0);

        // prepare the output array
        uint[] memory speakerTalksId = new uint[](speakers[_speaker].talksId.length);
        uint256[] memory speakerRewards = new uint256[](speakers[_speaker].talksId.length);

        // retrieve ratings and votes for all talks given by the speaker
        for (uint i = 0; i < speakers[_speaker].talksId.length; i ++) {
            uint talkId = speakers[_speaker].talksId[i];

            // skip canceled talks
            if (talks[talkId].canceled == false) {
                Vote[] memory votes = allVotes[talkId];
                // process votes for the talks given by the speaker
                uint totalRatings = 0;
                uint totalVotes = 0;
                for (uint j = 0; j < votes.length; j ++) {
                    Vote memory vote = votes[j];

                    // skip deleted votes
                    if (vote.attendee != 0x0) {
                        totalRatings += vote.rating;
                        totalVotes ++;
                    }
                }

                // save the information
                speakerTalksId[i] = talkId;
                speakerRewards[i] = computeReward(totalRatings, totalVotes);
            }
        }

        return (speakerTalksId, speakerRewards);
    }

    // computer the reward earned by a speaker
    function computeReward(uint ratings, uint votes) internal returns (uint256) {
        return ((ratings * votes * REGISTRATION_PRICE) / 1000);
    }

}