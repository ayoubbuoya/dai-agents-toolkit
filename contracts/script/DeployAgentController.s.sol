// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {AgentController} from "../src/AgentsController.sol";

contract DeployAgentsController is Script {
    AgentController public agentController;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        agentController = new AgentController();

        vm.stopBroadcast();
    }
}
