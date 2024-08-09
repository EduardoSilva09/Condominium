// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library CondominiumLib {
    enum Status {
        IDLE,
        VOTING,
        APPROVED,
        DENIED
    }
    enum Options {
        EMPTY,
        YES,
        NO,
        ABSTENTION
    }
    struct Topic {
        string title;
        string description;
        Status status;
        uint256 createdDate;
        uint256 startDate;
        uint256 endDate;
    }
}
