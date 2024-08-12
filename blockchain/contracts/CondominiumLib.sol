// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library CondominiumLib {
    enum Status {
        IDLE,
        VOTING,
        APPROVED,
        DENIED,
        SPENT
    }
    enum Options {
        EMPTY,
        YES,
        NO,
        ABSTENTION
    }
    enum Category {
        DECISION,
        SPENT,
        CHANGE_QUOTA,
        CHANGE_MANAGER
    }
    struct Topic {
        string title;
        string description;
        Status status;
        uint256 createdDate;
        uint256 startDate;
        uint256 endDate;
        Category category;
        uint amount;
        address responsible;
    }
    struct Vote {
        address resident;
        uint16 residence;
        Options option;
        uint256 timestamp;
    }
}
