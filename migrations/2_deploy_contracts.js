var conference = artifacts.require("./Conference.sol");

module.exports = function(deployer) {
    deployer.deploy(conference);
};