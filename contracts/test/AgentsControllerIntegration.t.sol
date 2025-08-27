// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {AgentController} from "../src/AgentsController.sol";

/**
 * @title AgentsController Integration Tests
 * @notice Tests for integration scenarios and real-world usage patterns
 */
contract AgentsControllerIntegrationTest is Test {
    AgentController public agentController;
    
    // Simulated external agents
    address public aiAgent = address(0x100);
    address public chatBot = address(0x200);
    address public taskAgent = address(0x300);
    address public user = address(0x400);
    
    function setUp() public {
        agentController = new AgentController();
    }
    
    /**
     * @notice Test a complete conversation flow between multiple agents
     */
    function test_CompleteConversationFlow() public {
        // 1. Register multiple agents
        vm.prank(aiAgent);
        uint256 aiAgentId = agentController.registerAgent(
            "AI Assistant",
            AgentController.AgentRole.Agent,
            "QmAIAgentHash"
        );
        
        vm.prank(chatBot);
        uint256 chatBotId = agentController.registerAgent(
            "Chat Bot",
            AgentController.AgentRole.Chat,
            "QmChatBotHash"
        );
        
        vm.prank(taskAgent);
        uint256 taskAgentId = agentController.registerAgent(
            "Task Executor",
            AgentController.AgentRole.Agent,
            "QmTaskAgentHash"
        );
        
        // 2. User initiates conversation with AI Agent
        vm.prank(user);
        agentController.sendMessageToAgent(aiAgentId, "Help me plan my day");
        
        // 3. AI Agent responds to user
        vm.prank(aiAgent);
        agentController.respondToAgent(0, 0, "I'll help you plan your day. Let me consult other agents.");
        
        // 4. AI Agent asks Task Agent for task management
        vm.prank(aiAgent);
        agentController.sendMessageToAgent(taskAgentId, "What tasks should be prioritized today?");
        
        // 5. Task Agent responds with recommendations
        vm.prank(taskAgent);
        agentController.respondToAgent(1, aiAgentId, "Focus on high-priority items first: meetings, deadlines, then personal tasks.");
        
        // 6. AI Agent asks Chat Bot for motivational message
        vm.prank(aiAgent);
        agentController.sendMessageToAgent(chatBotId, "Provide a motivational message for productivity");
        
        // 7. Chat Bot responds
        vm.prank(chatBot);
        agentController.respondToAgent(2, aiAgentId, "Stay focused, break tasks into smaller steps, and celebrate small wins!");
        
        // 8. AI Agent provides final response to user
        vm.prank(aiAgent);
        agentController.respondToAgent(0, 0, "Based on expert advice: prioritize high-impact tasks and stay motivated!");
        
        // Verify all agents are registered
        assertEq(agentController.countAgents(), 3, "Should have 3 registered agents");
        
        // Verify agent data
        AgentController.Agent[] memory agents = agentController.listAgents();
        assertEq(agents[0].name, "AI Assistant", "First agent name should match");
        assertEq(agents[1].name, "Chat Bot", "Second agent name should match");
        assertEq(agents[2].name, "Task Executor", "Third agent name should match");
    }
    
    /**
     * @notice Test agent collaboration on a complex task
     */
    function test_AgentCollaboration() public {
        // Register specialized agents
        vm.prank(address(0x501));
        uint256 researchAgentId = agentController.registerAgent(
            "Research Agent",
            AgentController.AgentRole.Agent,
            "QmResearchHash"
        );
        
        vm.prank(address(0x502));
        uint256 analysisAgentId = agentController.registerAgent(
            "Analysis Agent",
            AgentController.AgentRole.Agent,
            "QmAnalysisHash"
        );
        
        vm.prank(address(0x503));
        uint256 summaryAgentId = agentController.registerAgent(
            "Summary Agent",
            AgentController.AgentRole.Chat,
            "QmSummaryHash"
        );
        
        // Simulate a research workflow
        // 1. Research Agent gathers information
        vm.prank(address(0x501));
        agentController.sendMessageToAgent(analysisAgentId, "Raw data: Sales increased 15% this quarter");
        
        // 2. Analysis Agent processes the data
        vm.prank(address(0x502));
        agentController.respondToAgent(0, researchAgentId, "Analysis complete: Growth trend is positive");
        
        // 3. Analysis Agent sends results to Summary Agent
        vm.prank(address(0x502));
        agentController.sendMessageToAgent(summaryAgentId, "Generate summary: 15% sales growth, positive trend");
        
        // 4. Summary Agent creates final report
        vm.prank(address(0x503));
        agentController.respondToAgent(1, analysisAgentId, "Executive Summary: Strong Q4 performance with 15% sales growth indicating healthy business trajectory");
        
        // Verify the collaboration completed successfully
        assertEq(agentController.countAgents(), 3, "All collaboration agents should be registered");
    }
    
    /**
     * @notice Test error handling in multi-agent scenarios
     */
    function test_ErrorHandlingInMultiAgentScenario() public {
        // Register one agent
        vm.prank(aiAgent);
        agentController.registerAgent(
            "Solo Agent",
            AgentController.AgentRole.Agent,
            "QmSoloHash"
        );
        
        // Try to send message to non-existent agent
        vm.expectRevert("AGENT_NOT_FOUND");
        vm.prank(aiAgent);
        agentController.sendMessageToAgent(999, "This should fail");
        
        // Try to respond to non-existent agent
        vm.expectRevert("RECV_AGENT_NOT_FOUND");
        vm.prank(aiAgent);
        agentController.respondToAgent(0, 999, "This should also fail");
    }
    
    /**
     * @notice Test high-volume message scenario
     */
    function test_HighVolumeMessaging() public {
        // Register agents
        vm.prank(aiAgent);
        uint256 agent1Id = agentController.registerAgent("Agent1", AgentController.AgentRole.Agent, "Hash1");
        
        vm.prank(chatBot);
        uint256 agent2Id = agentController.registerAgent("Agent2", AgentController.AgentRole.Chat, "Hash2");
        
        // Send multiple messages
        for (uint i = 0; i < 10; i++) {
            vm.prank(aiAgent);
            agentController.sendMessageToAgent(agent2Id, string(abi.encodePacked("Message ", vm.toString(i))));
        }
        
        // Respond to all messages
        for (uint i = 0; i < 10; i++) {
            vm.prank(chatBot);
            agentController.respondToAgent(i, agent1Id, string(abi.encodePacked("Response ", vm.toString(i))));
        }
        
        // Verify system handles high volume correctly
        assertEq(agentController.countAgents(), 2, "Should maintain correct agent count");
    }
    
    /**
     * @notice Test mixed role interactions
     */
    function test_MixedRoleInteractions() public {
        // Register agents with different roles
        vm.prank(address(0x601));
        uint256 agentRoleId = agentController.registerAgent(
            "Full Agent",
            AgentController.AgentRole.Agent,
            "QmFullAgentHash"
        );
        
        vm.prank(address(0x602));
        uint256 chatRoleId = agentController.registerAgent(
            "Chat Only",
            AgentController.AgentRole.Chat,
            "QmChatOnlyHash"
        );
        
        // Agent role can send messages to Chat role
        vm.prank(address(0x601));
        agentController.sendMessageToAgent(chatRoleId, "Can you help with this query?");
        
        // Chat role can respond to Agent role
        vm.prank(address(0x602));
        agentController.respondToAgent(0, agentRoleId, "Yes, I can help with that!");
        
        // Chat role can also initiate conversations
        vm.prank(address(0x602));
        agentController.sendMessageToAgent(agentRoleId, "I have a question for you");
        
        // Agent role responds
        vm.prank(address(0x601));
        agentController.respondToAgent(1, chatRoleId, "I'm listening, what's your question?");
        
        // Verify both roles can interact bidirectionally
        AgentController.Agent[] memory agents = agentController.listAgents();
        assertEq(uint(agents[0].role), uint(AgentController.AgentRole.Agent), "First should be Agent role");
        assertEq(uint(agents[1].role), uint(AgentController.AgentRole.Chat), "Second should be Chat role");
    }
}
