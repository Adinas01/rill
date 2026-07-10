// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {StreamPay} from "../src/StreamPay.sol";

/// @notice Deploys StreamPay.
///   forge script script/Deploy.s.sol --rpc-url $ARC_RPC_URL --broadcast
contract Deploy is Script {
    function run() external returns (StreamPay streamPay) {
        vm.startBroadcast();
        streamPay = new StreamPay();
        vm.stopBroadcast();
        console.log("StreamPay:", address(streamPay));
    }
}
