//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./IDAOAccessControl.sol";

abstract contract ModuleBase {
    error NotAuthorized();

    IDAOAccessControl public accessControl;

    constructor(address _accessControl) {
        accessControl = IDAOAccessControl(_accessControl);
    }

    modifier authorized {
        if (!accessControl.isAuthorized(msg.sender, address(this), msg.sig)) {
            revert NotAuthorized();
        }
        _;
    }
}
