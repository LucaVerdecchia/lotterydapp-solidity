// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

interface ERC20_TokenInterface {
    function mint(address account, uint256 amount) external;
}

interface ERC721_TokenInterface {
    function mint(address account) external;
}

contract LotteryDAPP is Ownable, VRFConsumerBaseV2 {
    struct extractionHistoryStruct {
        address winner;
        uint randomWord;
        bool fulfilled;
        address[] users;
        uint requestId;
    }
    
    /** VRF SYSTEM VARIABLES */
    VRFCoordinatorV2Interface COORDINATOR;
    uint32 constant LINK_NUMBER_OF_WORDS = 1;
    uint16 constant LINK_NUMBER_OF_CONFIRMATION = 3;
    uint32 constant LINK_CALLBACK_GAS_LIMIT = 2500000;  
    bytes32 linkKeyHash;
    address linkVrfCoordinator;
    uint64 vrf_subscription_id;
    /** END VRD SYSTEM VARIABLES */

    uint constant REWARD_AMOUNT = 50000; // Amount of tokens to be given to the winner
    ERC20_TokenInterface public lotToken;
    ERC721_TokenInterface public lotNftToken;

    uint extractionDate;
    uint nextExtractionDate; 

    mapping(uint => extractionHistoryStruct) private extractionHistory;
    uint[] extractionDates;

    event PickWinnerRequest(uint requestId);
    event PickWinnerResult(uint requestId, address winner);

    constructor(uint _nextExtractionDate, uint64 subscriptionId, address _lotToken, address _lotNftToken, address _linkVrfCoordinator, bytes32 _linkKeyHash) VRFConsumerBaseV2(_linkVrfCoordinator){
        extractionDate = _nextExtractionDate;
        linkVrfCoordinator = _linkVrfCoordinator;
        linkKeyHash = _linkKeyHash;
        COORDINATOR = VRFCoordinatorV2Interface(_linkVrfCoordinator);
        vrf_subscription_id = subscriptionId;
        lotToken = ERC20_TokenInterface(_lotToken);
        lotNftToken = ERC721_TokenInterface(_lotNftToken);
    }

    function getExtractionDate() public view returns(uint) {
        return extractionDate;
    }

    function getLotteryUsers(uint _extractionDate) public view returns(address[] memory){
        return extractionHistory[_extractionDate].users;
    }

    function getLotteryInfo(uint _extractionDate) public view returns(address, uint, bool, address[] memory, uint){
        return (
            extractionHistory[_extractionDate].winner,
            extractionHistory[_extractionDate].randomWord,
            extractionHistory[_extractionDate].fulfilled,
            extractionHistory[_extractionDate].users,
            extractionHistory[_extractionDate].requestId
        );
    }

    function getLotteryUsersLength(uint _extractionDate) public view returns(uint){
        return extractionHistory[_extractionDate].users.length;
    }

    function getExtractionDates() public view returns(uint[] memory){
        return extractionDates;
    }

    function addUserToLottery(address user) public onlyOwner {
        require(!isUserAlreadyInLottery(user), "User can be added only one time for the same extraction");
        extractionHistory[extractionDate].users.push(user);
    }

    function addUserToLotteryBatch(address[] memory users) public onlyOwner {
        uint256 numUsers = users.length;
        for (uint256 i = 0; i < numUsers; i++) {
            addUserToLottery(users[i]);
        }
    } 

    function updateExtractionDate(uint _nextExtractionDate) public onlyOwner{
        extractionDate = _nextExtractionDate;
    }

    function pickWinner(uint _nextExtractionDate) public onlyOwner returns (uint256 requestId){
        require(block.timestamp >= extractionDate, "This function can only be executed after extraction date");
        uint s_requestId = COORDINATOR.requestRandomWords(
            linkKeyHash,
            vrf_subscription_id,
            LINK_NUMBER_OF_CONFIRMATION,
            LINK_CALLBACK_GAS_LIMIT,
            LINK_NUMBER_OF_WORDS
        );
        
       extractionHistory[extractionDate].randomWord = 0;
       extractionHistory[extractionDate].fulfilled = false;
       extractionHistory[extractionDate].requestId = s_requestId;
       nextExtractionDate = _nextExtractionDate;
       extractionDates.push(extractionDate);
       emit PickWinnerRequest(s_requestId);
       return s_requestId;
    }

    function fulfillRandomWords(uint256 _requestId, uint256[] memory _randomWords) internal override{
        require(extractionHistory[extractionDate].requestId == _requestId, "request not found");
        extractionHistory[extractionDate].fulfilled = true;
        extractionHistory[extractionDate].randomWord = _randomWords[0];

        uint index = _randomWords[0] % getLotteryUsersLength(extractionDate);
        address winner = extractionHistory[extractionDate].users[index];
        extractionHistory[extractionDate].winner = winner;

        extractionDate = nextExtractionDate;
        rewardWinner(winner);
        emit PickWinnerResult(_requestId, winner);
    }

    function rewardWinner(address _winner) internal {
        lotToken.mint(_winner, REWARD_AMOUNT);
        lotNftToken.mint(_winner);
    }

    function isUserAlreadyInLottery(address _addressToCheck) internal view returns (bool) {
        for (uint256 i = 0; i < extractionHistory[extractionDate].users.length; i++) {
            if (extractionHistory[extractionDate].users[i] == _addressToCheck) {
                return true;
            }
        }
        return false;
    }
}

