// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CondominiumLib.sol";

interface ICondominium {
    function addResident(address resident, uint16 residenceId) external;
    function removeResident(address resident) external;
    function residenceExists(uint16 residenceId) external returns (bool);
    function setCouncelor(address resident, bool isEntering) external;
    function setManager(address newManager) external;
    function addTopic(string memory title, string memory description) external;
    function removeTopic(string memory title) external;
    function openVoting(string memory title) external;
    function vote(string memory title, CondominiumLib.Options option) external;
    function closeVoting(string memory title) external;
}
