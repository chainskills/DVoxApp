pragma solidity ^0.4.15;


contract Conference {
    // State variables
    string title;
    string location;
    uint startTime;
    uint endTime;
    address speakerAddress;
    string speakerName;


    // add an talk
    function addTalk(
        string _title,
        string _location,
        uint _startTime,
        uint _endTime,
        address _speakerAddress,
        string _speakerName
        ) public {


        title = _title;
        location = _location;
        startTime = _startTime;
        endTime = _endTime;
        speakerAddress = _speakerAddress;
        speakerName = _speakerName;
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
}