// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ICondominium.sol";
import "./CondominiumLib.sol";

contract Condominium is ICondominium {
    address public manager; //Ownable
    mapping(uint16 => bool) public residences;
    mapping(address => uint16) public residents;
    mapping(address => bool) public counselors;

    struct Vote {
        address resident;
        uint16 residence;
        CondominiumLib.Options option;
        uint256 timestamp;
    }

    mapping(bytes32 => CondominiumLib.Topic) public topics;
    mapping(bytes32 => Vote[]) public votings;

    constructor() {
        manager = msg.sender;
        //blocks
        for (uint8 i = 1; i <= 2; i++) {
            //floors
            for (uint8 j = 1; j < 5; j++) {
                //units
                for (uint8 k = 1; k < 5; k++) {
                    unchecked {
                        residences[(i * 1000) + (j * 100) + k] = true;
                    }
                }
            }
        }
    }

    modifier onlyManager() {
        require(msg.sender == manager, "Only the manager can do this");
        _;
    }

    modifier onlyCounselors() {
        require(
            msg.sender == manager || counselors[msg.sender],
            "Only the manager or the counselors can do this"
        );
        _;
    }

    modifier onlyResidents() {
        require(
            msg.sender == manager || isResident(msg.sender),
            "Only the manager or the residents can do this"
        );
        _;
    }

    function residenceExists(uint16 residenceId) public view returns (bool) {
        return residences[residenceId];
    }

    function isResident(address resident) public view returns (bool) {
        return (residents[resident] > 0);
    }

    function addResident(
        address resident,
        uint16 residenceId
    ) external onlyCounselors {
        require(residenceExists(residenceId), "This residence does not exists");
        residents[resident] = residenceId;
    }

    function removeResident(address resident) external onlyManager {
        require(!counselors[resident], "A counceler cannot be removed");
        delete residents[resident];
    }

    function setCouncelor(
        address resident,
        bool isEntering
    ) external onlyManager {
        if (isEntering) {
            require(isResident(resident), "The councelor must be a resident");
            counselors[resident] = true;
        } else {
            counselors[resident] = false;
        }
    }

    function setManager(address newManager) external onlyManager {
        require(newManager != address(0), "The address must be valid");
        manager = newManager;
    }

    function getTopic(
        string memory title
    ) public view returns (CondominiumLib.Topic memory) {
        bytes32 topicId = keccak256(bytes(title));
        return topics[topicId];
    }

    function topicExists(string memory title) public view returns (bool) {
        return getTopic(title).createdDate > 0;
    }

    function addTopic(
        string memory title,
        string memory description
    ) external onlyResidents {
        require(!topicExists(title), "This topic already exists");

        CondominiumLib.Topic memory newTopic = CondominiumLib.Topic({
            title: title,
            description: description,
            status: CondominiumLib.Status.IDLE,
            createdDate: block.timestamp,
            startDate: 0,
            endDate: 0
        });

        topics[keccak256(bytes(title))] = newTopic;
    }

    function removeTopic(string memory title) external onlyManager {
        CondominiumLib.Topic memory topic = getTopic(title);
        require(topic.createdDate > 0, "The topic does not exists");
        require(
            topic.status == CondominiumLib.Status.IDLE,
            "Only IDLE topics can be removed"
        );
        delete topics[keccak256(bytes(title))];
    }

    function openVoting(string memory title) external onlyManager {
        CondominiumLib.Topic memory topic = getTopic(title);
        require(topic.createdDate > 0, "The topic does not exists");
        require(
            topic.status == CondominiumLib.Status.IDLE,
            "Only IDLE topics can be open for voting"
        );

        bytes32 topicId = keccak256(bytes(title));
        topics[topicId].status = CondominiumLib.Status.VOTING;
        topics[topicId].startDate = block.timestamp;
    }

    function vote(
        string memory title,
        CondominiumLib.Options option
    ) external onlyResidents {
        require(
            option != CondominiumLib.Options.EMPTY,
            "The option cannot be EMPTY"
        );

        CondominiumLib.Topic memory topic = getTopic(title);
        require(topic.createdDate > 0, "The topic does not exists");
        require(
            topic.status == CondominiumLib.Status.VOTING,
            "Only VOTING topics can be voted"
        );
        uint16 residence = residents[msg.sender];
        bytes32 topicId = keccak256(bytes(title));
        Vote[] memory votes = votings[topicId];
        for (uint8 i = 0; i < votes.length; i++) {
            if (votes[i].residence == residence) {
                require(false, "A residence should vote only once");
            }
        }

        Vote memory newVote = Vote({
            resident: msg.sender,
            residence: residence,
            option: option,
            timestamp: block.timestamp
        });

        votings[topicId].push(newVote);
    }

    function closeVoting(string memory title) external onlyManager {
        CondominiumLib.Topic memory topic = getTopic(title);
        require(topic.createdDate > 0, "The topic does not exists");
        require(
            topic.status == CondominiumLib.Status.VOTING,
            "Only VOTING topics can be closed"
        );

        uint8 approved = 0;
        uint8 denied = 0;
        uint8 abstenctions = 0;
        bytes32 topicId = keccak256(bytes(title));
        Vote[] memory votes = votings[topicId];
        for (uint8 i = 0; i < votes.length; i++) {
            if (votes[i].option == CondominiumLib.Options.YES) {
                approved++;
            } else if (votes[i].option == CondominiumLib.Options.NO) {
                denied++;
            } else {
                abstenctions++;
            }
        }

        if (approved > denied)
            topics[topicId].status = CondominiumLib.Status.APPROVED;
        else topics[topicId].status = CondominiumLib.Status.DENIED;

        topics[topicId].endDate = block.timestamp;
    }

    function numberOfVotes(
        string memory title
    ) external view returns (uint256) {
        bytes32 topicId = keccak256(bytes(title));
        return votings[topicId].length;
    }
}
