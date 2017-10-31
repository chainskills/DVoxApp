pragma solidity ^0.4.15;


contract Conference {
    // State variables
    address owner;
    string title;
    string location;
    uint startTime;
    uint endTime;
    address speakerAddress;
    string speakerName;

    address attendeeAddress;
    string attendeeName;

    uint256 constant REGISTRATION_PRICE = 1800000000000000000;

    // Events
    event AddTalkEvent(string _title, uint _startTime, uint _endTime);
    event RegisterEvent(address indexed _account, string _name);

    // constructor
    function Conference() {
        owner = msg.sender;
    }

    // add an talk
    function addTalk(
        string _title,
        string _location,
        uint _startTime,
        uint _endTime,
        address _speakerAddress,
        string _speakerName
        ) public {

        if (msg.sender != owner) {
            return;
        }

        title = _title;
        location = _location;
        startTime = _startTime;
        endTime = _endTime;
        speakerAddress = _speakerAddress;
        speakerName = _speakerName;

        AddTalkEvent(title, startTime, endTime);
    }
    // get the talk
    function getTalk() public constant returns (
        string _title,
        string _location,
        uint _startTime,
        uint _endTime,
        address _speakerAddress,
        string _speakerName) {

        return (title, location, startTime, endTime, speakerAddress, speakerName);
    }

    // register an attendee to the conference
    // returns true if the registration is successful
    function register(string _fullName) public payable {

        // the price to pay must be the same as the registration price
        require(msg.value == REGISTRATION_PRICE);

        // not already registered
        require(msg.sender != attendeeAddress);

        // register the attendee
        attendeeAddress = msg.sender;
        attendeeName = _fullName;

        RegisterEvent(attendeeAddress, attendeeName);
    }

    // check if an attendee is registered
    // returns true if the attendee is registered
    function isRegistered(address _account) public constant returns (bool) {
        if ((_account != attendeeAddress) || (_account == 0x0)) {
            // not registered or no registration yet or
            return false;
        }

        return true;
    }
}