//SPDX-License-Identifier: MIT

// contracts/BuyMeACoffee.sol
pragma solidity ^0.8.0;

// Contract Address on Goerli: 0xd1eF9e6381bb06E6F6280fc54E806656617A051d

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract BuyMeACoffee {
    // Event to emit when a Memo is created.
    event NewMemo(
        address indexed from,
        uint256 timestamp,
        string name,
        string message,
        uint256 amount
    );
    
    // Memo struct.
    struct Memo {
        address from;
        uint256 timestamp;
        string name;
        string message;
        uint256 amount;
    }
    
    // Address of contract deployer
    address owner;

    // Address where to withdraw the tips to
    address payable withdrawalAddress;

    // List of all memos received from coffee purchases.
    Memo[] memos;

    constructor() {
        //Deployer is the owner of the contract and the initial address to withdraw to
        owner = msg.sender;
        withdrawalAddress = payable(msg.sender);
    }

    /**
     * @dev fetches all stored memos
     */
    function getMemos() public view returns (Memo[] memory) {
        return memos;
    }

    /**
     * @dev buy a coffee for owner (sends an ETH tip and leaves a memo)
     * @param _name name of the coffee purchaser
     * @param _message a nice message from the purchaser
     */
    function buyCoffee(string memory _name, string memory _message) public payable {
        // Must accept more than 0 ETH for a coffee.
        require(msg.value > 0, "can't buy coffee for free!");

        // Add the memo to storage!
        memos.push(Memo(
            msg.sender,
            block.timestamp,
            _name,
            _message,
            msg.value
        ));

        // Emit a NewMemo event with details about the memo.
        emit NewMemo(
            msg.sender,
            block.timestamp,
            _name,
            _message,
            msg.value
        );
    }

    /**
     * @dev send the entire balance stored in this contract to the owner
     */
    function withdrawTips() public {
        require(withdrawalAddress.send(address(this).balance));
    }

    /**
     * @dev change the withdrawal address for tips. Only the owner can do this
     */
    function setWithdrawalAddress (address _withdrawalAddress) public {
        require(msg.sender == owner, "Only the owner can call this function");
        require(_withdrawalAddress != address(0), "Invalid withdrawal address");
        withdrawalAddress = payable(_withdrawalAddress);
    }
}
