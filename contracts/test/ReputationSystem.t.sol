// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {AgentController} from "../src/AgentsController.sol";

contract ReputationSystemTest is Test {
    AgentController public agentController;
    
    // Test addresses
    address public agent1 = address(0x1);
    address public agent2 = address(0x2);
    address public agent3 = address(0x3);
    
    // Test data
    string constant AGENT_NAME_1 = "TestAgent1";
    string constant AGENT_NAME_2 = "TestAgent2";
    string constant AGENT_NAME_3 = "TestAgent3";
    string constant IPFS_HASH = "QmTestHash";
    
    function setUp() public {
        agentController = new AgentController();
    }
    
    function testBasicReputation() public {
        // Register agents
        vm.prank(agent1);
        uint256 agentId1 = agentController.registerAgent(AGENT_NAME_1, AgentController.AgentRole.Agent, IPFS_HASH);
        
        vm.prank(agent2);
        uint256 agentId2 = agentController.registerAgent(AGENT_NAME_2, AgentController.AgentRole.Chat, IPFS_HASH);
        
        vm.prank(agent3);
        uint256 agentId3 = agentController.registerAgent(AGENT_NAME_3, AgentController.AgentRole.Agent, IPFS_HASH);
        
        // Check initial reputation (should be 100%)
        (uint256 trustScore, uint256 totalInteractions, uint256 positiveRatings) = agentController.getAgentReputation(agentId1);
        assertEq(trustScore, 100);
        assertEq(totalInteractions, 0);
        assertEq(positiveRatings, 0);
        
        // Agent 2 rates Agent 1 positively
        vm.prank(agent2);
        agentController.rateAgent(agentId1, true, "Great work!");
        
        // Check updated reputation
        (trustScore, totalInteractions, positiveRatings) = agentController.getAgentReputation(agentId1);
        assertEq(trustScore, 100); // 1/1 = 100%
        assertEq(totalInteractions, 1);
        assertEq(positiveRatings, 1);
        
        // Agent 3 rates Agent 1 negatively
        vm.prank(agent3);
        agentController.rateAgent(agentId1, false, "Needs improvement");
        
        // Check updated reputation (should be 50%)
        (trustScore, totalInteractions, positiveRatings) = agentController.getAgentReputation(agentId1);
        assertEq(trustScore, 50); // 1/2 = 50%
        assertEq(totalInteractions, 2);
        assertEq(positiveRatings, 1);
    }
    
    function testCannotRateSelf() public {
        // Register agent
        vm.prank(agent1);
        uint256 agentId1 = agentController.registerAgent(AGENT_NAME_1, AgentController.AgentRole.Agent, IPFS_HASH);
        
        // Try to rate self (should fail)
        vm.prank(agent1);
        vm.expectRevert("CANNOT_RATE_SELF");
        agentController.rateAgent(agentId1, true, "I'm great!");
    }
    
    function testCannotRateTwice() public {
        // Register agents
        vm.prank(agent1);
        uint256 agentId1 = agentController.registerAgent(AGENT_NAME_1, AgentController.AgentRole.Agent, IPFS_HASH);
        
        vm.prank(agent2);
        uint256 agentId2 = agentController.registerAgent(AGENT_NAME_2, AgentController.AgentRole.Chat, IPFS_HASH);
        
        // Agent 2 rates Agent 1
        vm.prank(agent2);
        agentController.rateAgent(agentId1, true, "Great work!");
        
        // Try to rate again (should fail)
        vm.prank(agent2);
        vm.expectRevert("ALREADY_RATED");
        agentController.rateAgent(agentId1, false, "Changed my mind");
    }
    
    function testTopRatedAgents() public {
        // Register three agents
        vm.prank(agent1);
        uint256 agentId1 = agentController.registerAgent(AGENT_NAME_1, AgentController.AgentRole.Agent, IPFS_HASH);
        
        vm.prank(agent2);
        uint256 agentId2 = agentController.registerAgent(AGENT_NAME_2, AgentController.AgentRole.Chat, IPFS_HASH);
        
        vm.prank(agent3);
        uint256 agentId3 = agentController.registerAgent(AGENT_NAME_3, AgentController.AgentRole.Agent, IPFS_HASH);
        
        // Agent 1 rates Agent 2 positively
        vm.prank(agent1);
        agentController.rateAgent(agentId2, true, "Great!");
        
        // Agent 3 rates Agent 2 positively
        vm.prank(agent3);
        agentController.rateAgent(agentId2, true, "Excellent!");
        
        // Agent 1 rates Agent 3 negatively
        vm.prank(agent1);
        agentController.rateAgent(agentId3, false, "Not good");
        
        // Get top rated agents
        AgentController.Agent[] memory topAgents = agentController.getTopRatedAgents();
        
        // Agent 2 should be first (100% trust score with interactions)
        // Agent 1 should be second (100% trust score with no interactions)
        // Agent 3 should be last (0% trust score)
        assertEq(topAgents.length, 3);
        assertEq(topAgents[0].id, agentId2); // Agent 2 should be top rated
    }
}
