# DVox - Vote for your talks on Ethereum

DVox is a decentralised application built for Ethereum providing these features:
* create new talks
* get the details of these talks
$ register attendees using crypto-currencies
* attendees can vote for talks they attend
* speakers get rewarded based on the reviews they got from attendees

This source code is related to the University session given by ChainSkills (Sébastien Arbogast and Said Eloudrhiri) at Devoxx Belgium 2017.

Check the video on YouTube: TBC

## Disclaimers
* This is just a sample application used for education purpose
* This is by no means usable in production

## Prerequisites: Install tools and frameworks

To build, deploy and test your Dapp locally, you need to install the following tools and frameworks:
* **node.js and npm**: https://nodejs.org
  * Node.js can be installed using an installation package or through some package managers like Homebrew on a Mac.

* **Truffle**: https://github.com/trufflesuite/truffle
  * Create and deploy your Dapp with this build framework for Ethereum.
  * This sample is compliant with truffle 3.4.11
  * ```npm install -g truffle@3.4.11```

* **testrpc**: https://github.com/ethereumjs/testrpc
  * Simulates an Ethereum node
  * ```npm install -g ethereumjs-testrpc```

* **Mestamask**: https://metamask.io/
  * Transforms Chrome into a Dapp browser

## Step 1. Clone the project

`git clone https://github.com/chainskills/DVox.git`

## Step 2. Install all dependencies

```
$ cd DVox
$ npm install
```

## Step 3. Start your Ethereum node

Start testrpc using the same accounts:
```
$ testrpc --seed 0
```

The first account will be the **coinbase**, the account that will deploy the contracts.


## Step 4. Test your smart contract
```
$ truffle test
```

## Step 5. Compile and deploy your smart contract

```
$ truffle migrate --reset
```

You will have to migrate (deploy) your smart contract each time your restart **testrpc**.

## Step 6. Metamask: connect to your local Ethereum node

Unlock the Metamask extension in Chrome, and switch it to the network "Localhost 8545".

## Step 7. Metamask: import your accounts

Import accounts defined in your testrpc Ethereum node. 
You will have to provide the private key of these accounts.

You can find the private keys in the testrpc console.

In Metamask, rename these accounts respectively:
* testrpc-coinbase
* testrpc-speaker1
* testrpc-speaker2
* testrpc-attendee1
* testrpc-attendee2

## Step 8. Run your frontend application

```
$ npm run dev
```

In your browser, open the following URL: http://localhost:3000

## Step 9. Metamask: switch to the `testrpc-coinbase` account

When you switch accounts or networks in Metamask, you have to refresh your  page to let your frontend application know about it.

## Step 10. Add a talk

You can add talks as the contract's owner.

Metamask will ask you to confirm the transaction before adding the talk.

## Step 11. Interact with the smart contract:

From your console window, you can use the Truffle console to inspect the status of your contract:
```
truffle console
```

Here are a few examples:

### Open the console:
```
$ truffle console truffle(development)>
```

### Get an instance of the smart contract:
```
truffle(development)> Conference.deployed().then(function(instance) {app = instance; })
```
From now on, you can use the `app` variable to interact with your smart contract.

### List your accounts:
```
truffle(development)> web3.eth.accounts
[ '0xf6b39ce8221a48a0ceca0b4d375682c622e1829b',
  '0xafb2ddcf3a047c4849bb0971b424cd62cfb4ea31',
  '0x74d6d051b6004c99ffc932540bb5c06f7affba62',
  '0x217735c6cf3c09037eab60f7c4fad2c197994d7d',
  '0xe292c3f3f11f63a33fda8ee168d3797e5e7a16c5',
  '0xa00791da14b623d56d4c5598eaf478c7c4a5945a',
  '0xd067220c87d629110eba04ec5d00272b2139b954',
  '0xb986420afd203ca9383c0abffc77e383d1cddb55',
  '0x85c99083a9a8d81698e5f795d51e427e34cfe271',
  '0x2e72b94d3015d4da22a54514a5ee9c105f6e12b5' ]
```

### Get the balance of your accounts:
```
truffle(development)> web3.fromWei(web3.eth.getBalance(web3.eth.accounts[1]), "ether").toNumber()
truffle(development)> web3.fromWei(web3.eth.getBalance(web3.eth.accounts[2]), "ether").toNumber()
```

### Get the balance of the contract:
```
truffle(development)> web3.fromWei(web3.eth.getBalance(Conference.address), "ether").toNumber()
```

### Add a talk
```
truffle(development)> startTime = new Date('11/07/2017 09:30').getTime() / 1000
truffle(development)> endTime = new Date('11/07/2017 12:30').getTime() / 1000
truffle(development)> var addTalkEvent = app.AddTalkEvent().watch(function(error, event) {console.log(event);})
truffle(development)> app.addTalk("Talk 1", "room 1", startTime, endTime, [web3.eth.accounts[1], web3.eth.accounts[2]], ["Said Eloudrhiri", "Sebastien Arbogast"], {from: web3.eth.accounts[0]})
truffle(development)> app.addTalk("Talk 2", "room 2", startTime, endTime, [web3.eth.accounts[3]], ["John Doe"], {from: web3.eth.accounts[0]})
```

### Get the number of talks:
```
truffle(development)> app.getNumberOfTalks()
```

### get ID of all talks not canceled
```
truffle(development)> app.getTalks(false)
```

### get the detail of a talk
```
truffle(development)> app.getTalk(1)
```

### Cancel a talk
```
truffle(development)> app.canceTalk(2, {from: web3.eth.accounts[0]})
```

### Register an attendee:
```
truffle(development)> var registrationEvent = app.RegisterEvent({_account: web3.eth.accounts[3]}).watch(function(error, event){ console.log(event);})
truffle(development)> app.register("Rick Deckard", {from: web3.eth.accounts[3], value: web3.toWei(1.8, "ether")})
```

### Add a vote
```
truffle(development)> app.addVote(1, 4, "I loved this talk", {from: web3.eth.accounts[3]})
```

### Display rewards that should earn a speaker
```
truffle(development)> app.getRewards(web3.eth.accounts[1])
```

### Reward a speaker
```
truffle(development)> app.withdrawReward({from: web3.eth.accounts[1]})
```

## Tips

* Is Metamask slow ? try to disable and enable the extension. This happens sometimes, especially when we work with a private chain.
* When you switch accounts in Metamask, don't forget to refresh the page to make sure you get the current account set in Metamask.

## Learn more

If you want to know more about all the steps required to install, build and  deploy a Dapp, you can subscribe to our course available on Udemy: https://www.udemy.com/getting-started-with-ethereum-solidity-development

Have fun !!!

ChainSkills Team - 2017
