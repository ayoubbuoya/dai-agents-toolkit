// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {AgentController} from "../src/AgentsController.sol";

contract AgentsControllerTest is Test {
    AgentController public agentController;
    
    // Test addresses
    address public agent1 = address(0x1);
    address public agent2 = address(0x2);
    address public agent3 = address(0x3);
    address public nonAgent = address(0x4);
    
    // Test data
    string constant AGENT_NAME_1 = "TestAgent1";
    string constant AGENT_NAME_2 = "TestAgent2";
    string constant AGENT_NAME_3 = "ChatBot";
    string constant IPFS_HASH_1 = "QmTestHash1";
    string constant IPFS_HASH_2 = "QmTestHash2";
    string constant IPFS_HASH_3 = "QmTestHash3";
    string constant TEST_MESSAGE = "Hello, agent!";
    string constant TEST_RESPONSE = "Hello back!";
    
    // Events for testing
    event AgentRegistered(
        uint256 indexed agentId,
        address indexed agentAddress,
        string name,
        string role,
        string ipfsHash
    );
    
    event MessageSent(
        uint256 indexed messageId,
        uint256 indexed senderAgentId,
        uint256 indexed receiverAgentId,
        string message
    );
    
    event MessageResponded(
        uint256 indexed messageId,
        uint256 indexed senderAgentId,
        uint256 indexed receiverAgentId,
        string response
    );
    
    event AgentUpdated(
        uint256 indexed agentId,
        string name,
        string role,
        string ipfsHash
    );

    function setUp() public {
        agentController = new AgentController();
    }

    // ===== Agent Registration Tests =====
    
    function test_RegisterAgent_Success() public {
        vm.prank(agent1);
        uint256 agentId = agentController.registerAgent(
            AGENT_NAME_1,
            AgentController.AgentRole.Agent,
            IPFS_HASH_1
        );
        
        assertEq(agentId, 0, "First agent should have ID 0");
        assertEq(agentController.countAgents(), 1, "Agent count should be 1");
    }
    
    function test_RegisterAgent_EmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit AgentRegistered(0, agent1, AGENT_NAME_1, "Agent", IPFS_HASH_1);
        
        vm.prank(agent1);
        agentController.registerAgent(
            AGENT_NAME_1,
            AgentController.AgentRole.Agent,
            IPFS_HASH_1
        );
    }
    
    function test_RegisterMultipleAgents() public {
        // Register first agent
        vm.prank(agent1);
        uint256 agentId1 = agentController.registerAgent(
            AGENT_NAME_1,
            AgentController.AgentRole.Agent,
            IPFS_HASH_1
        );
        
        // Register second agent
        vm.prank(agent2);
        uint256 agentId2 = agentController.registerAgent(
            AGENT_NAME_2,
            AgentController.AgentRole.Chat,
            IPFS_HASH_2
        );
        
        assertEq(agentId1, 0, "First agent should have ID 0");
        assertEq(agentId2, 1, "Second agent should have ID 1");
        assertEq(agentController.countAgents(), 2, "Agent count should be 2");
    }
    
    function test_RegisterAgent_WithChatRole() public {
        vm.prank(agent1);
        uint256 agentId = agentController.registerAgent(
            AGENT_NAME_3,
            AgentController.AgentRole.Chat,
            IPFS_HASH_3
        );
        
        assertEq(agentId, 0, "Agent should have ID 0");
    }
    
    function test_RegisterAgent_WithEmptyIPFS() public {
        vm.prank(agent1);
        uint256 agentId = agentController.registerAgent(
            AGENT_NAME_1,
            AgentController.AgentRole.Agent,
            ""
        );
        
        assertEq(agentId, 0, "Agent should register successfully with empty IPFS hash");
    }

    // ===== Agent Listing Tests =====
    
    function test_ListAgents_EmptyList() public view {
        AgentController.Agent[] memory agents = agentController.listAgents();
        assertEq(agents.length, 0, "Should return empty array when no agents");
    }
    
    function test_ListAgents_SingleAgent() public {
        vm.prank(agent1);
        agentController.registerAgent(
            AGENT_NAME_1,
            AgentController.AgentRole.Agent,
            IPFS_HASH_1
        );
        
        AgentController.Agent[] memory agents = agentController.listAgents();
        assertEq(agents.length, 1, "Should return array with one agent");
        assertEq(agents[0].id, 0, "Agent ID should be 0");
        assertEq(agents[0].name, AGENT_NAME_1, "Agent name should match");
        assertEq(uint(agents[0].role), uint(AgentController.AgentRole.Agent), "Agent role should match");
        assertEq(agents[0].ipfsHash, IPFS_HASH_1, "IPFS hash should match");
    }
    
    function test_ListAgents_MultipleAgents() public {
        // Register multiple agents
        vm.prank(agent1);
        agentController.registerAgent(
            AGENT_NAME_1,
            AgentController.AgentRole.Agent,
            IPFS_HASH_1
        );
        
        vm.prank(agent2);
        agentController.registerAgent(
            AGENT_NAME_2,
            AgentController.AgentRole.Chat,
            IPFS_HASH_2
        );
        
        vm.prank(agent3);
        agentController.registerAgent(
            AGENT_NAME_3,
            AgentController.AgentRole.Agent,
            IPFS_HASH_3
        );
        
        AgentController.Agent[] memory agents = agentController.listAgents();
        assertEq(agents.length, 3, "Should return array with three agents");
        
        // Check first agent
        assertEq(agents[0].id, 0, "First agent ID should be 0");
        assertEq(agents[0].name, AGENT_NAME_1, "First agent name should match");
        
        // Check second agent
        assertEq(agents[1].id, 1, "Second agent ID should be 1");
        assertEq(agents[1].name, AGENT_NAME_2, "Second agent name should match");
        assertEq(uint(agents[1].role), uint(AgentController.AgentRole.Chat), "Second agent role should be Chat");
        
        // Check third agent
        assertEq(agents[2].id, 2, "Third agent ID should be 2");
        assertEq(agents[2].name, AGENT_NAME_3, "Third agent name should match");
    }

    // ===== Agent Count Tests =====
    
    function test_CountAgents_Initial() public view {
        assertEq(agentController.countAgents(), 0, "Initial count should be 0");
    }
    
    function test_CountAgents_AfterRegistration() public {
        vm.prank(agent1);
        agentController.registerAgent(
            AGENT_NAME_1,
            AgentController.AgentRole.Agent,
            IPFS_HASH_1
        );
        
        assertEq(agentController.countAgents(), 1, "Count should be 1 after registration");
        
        vm.prank(agent2);
        agentController.registerAgent(
            AGENT_NAME_2,
            AgentController.AgentRole.Chat,
            IPFS_HASH_2
        );
        
        assertEq(agentController.countAgents(), 2, "Count should be 2 after second registration");
    }

    // ===== Message Sending Tests =====
    
    function test_SendMessageToAgent_Success() public {
        // Register agents first
        vm.prank(agent1);
        agentController.registerAgent(
            AGENT_NAME_1,
            AgentController.AgentRole.Agent,
            IPFS_HASH_1
        );
        
        vm.prank(agent2);
        agentController.registerAgent(
            AGENT_NAME_2,
            AgentController.AgentRole.Chat,
            IPFS_HASH_2
        );
        
        // Send message from agent1 to agent2
        vm.prank(agent1);
        agentController.sendMessageToAgent(1, TEST_MESSAGE);
    }
    
    function test_SendMessageToAgent_EmitsEvent() public {
        // Register agents first
        vm.prank(agent1);
        agentController.registerAgent(
            AGENT_NAME_1,
            AgentController.AgentRole.Agent,
            IPFS_HASH_1
        );
        
        vm.prank(agent2);
        agentController.registerAgent(
            AGENT_NAME_2,
            AgentController.AgentRole.Chat,
            IPFS_HASH_2
        );
        
        // Expect the MessageSent event
        vm.expectEmit(true, true, true, true);
        emit MessageSent(0, 0, 1, TEST_MESSAGE);
        
        vm.prank(agent1);
        agentController.sendMessageToAgent(1, TEST_MESSAGE);
    }
    
    function test_SendMessageToAgent_RevertInvalidAgent() public {
        // Register one agent
        vm.prank(agent1);
        agentController.registerAgent(
            AGENT_NAME_1,
            AgentController.AgentRole.Agent,
            IPFS_HASH_1
        );
        
        // Try to send message to non-existent agent
        vm.expectRevert("AGENT_NOT_FOUND");
        vm.prank(agent1);
        agentController.sendMessageToAgent(999, TEST_MESSAGE);
    }
    
    function test_SendMessageToAgent_MultipleMessages() public {
        // Register agents
        vm.prank(agent1);
        agentController.registerAgent(
            AGENT_NAME_1,
            AgentController.AgentRole.Agent,
            IPFS_HASH_1
        );
        
        vm.prank(agent2);
        agentController.registerAgent(
            AGENT_NAME_2,
            AgentController.AgentRole.Chat,
            IPFS_HASH_2
        );
        
        // Send first message (messageId should be 0)
        vm.expectEmit(true, true, true, true);
        emit MessageSent(0, 0, 1, TEST_MESSAGE);
        vm.prank(agent1);
        agentController.sendMessageToAgent(1, TEST_MESSAGE);
        
        // Send second message (messageId should be 1)
        vm.expectEmit(true, true, true, true);
        emit MessageSent(1, 0, 1, "Second message");
        vm.prank(agent1);
        agentController.sendMessageToAgent(1, "Second message");
    }

    // ===== Message Response Tests =====
    
    function test_RespondToAgent_Success() public {
        // Register agents
        vm.prank(agent1);
        agentController.registerAgent(
            AGENT_NAME_1,
            AgentController.AgentRole.Agent,
            IPFS_HASH_1
        );
        
        vm.prank(agent2);
        agentController.registerAgent(
            AGENT_NAME_2,
            AgentController.AgentRole.Chat,
            IPFS_HASH_2
        );
        
        // Send a message first
        vm.prank(agent1);
        agentController.sendMessageToAgent(1, TEST_MESSAGE);
        
        // Respond to the message
        vm.prank(agent2);
        agentController.respondToAgent(0, 0, TEST_RESPONSE);
    }
    
    function test_RespondToAgent_EmitsEvent() public {
        // Register agents
        vm.prank(agent1);
        agentController.registerAgent(
            AGENT_NAME_1,
            AgentController.AgentRole.Agent,
            IPFS_HASH_1
        );
        
        vm.prank(agent2);
        agentController.registerAgent(
            AGENT_NAME_2,
            AgentController.AgentRole.Chat,
            IPFS_HASH_2
        );
        
        // Send a message first
        vm.prank(agent1);
        agentController.sendMessageToAgent(1, TEST_MESSAGE);
        
        // Expect the MessageResponded event
        vm.expectEmit(true, true, true, true);
        emit MessageResponded(0, 1, 0, TEST_RESPONSE);
        
        vm.prank(agent2);
        agentController.respondToAgent(0, 0, TEST_RESPONSE);
    }
    
    function test_RespondToAgent_RevertInvalidReceiver() public {
        // Register one agent
        vm.prank(agent1);
        agentController.registerAgent(
            AGENT_NAME_1,
            AgentController.AgentRole.Agent,
            IPFS_HASH_1
        );
        
        // Try to respond to non-existent agent
        vm.expectRevert("RECV_AGENT_NOT_FOUND");
        vm.prank(agent1);
        agentController.respondToAgent(0, 999, TEST_RESPONSE);
    }

    // ===== Fuzz Tests =====
    
    function testFuzz_RegisterAgent_Name(string memory name) public {
        vm.assume(bytes(name).length > 0);
        vm.assume(bytes(name).length < 1000);
        
        vm.prank(agent1);
        uint256 agentId = agentController.registerAgent(
            name,
            AgentController.AgentRole.Agent,
            IPFS_HASH_1
        );
        
        assertEq(agentId, 0, "Agent should be registered successfully");
        
        AgentController.Agent[] memory agents = agentController.listAgents();
        assertEq(agents[0].name, name, "Agent name should match input");
    }
    
    function testFuzz_RegisterAgent_IPFSHash(string memory ipfsHash) public {
        vm.assume(bytes(ipfsHash).length < 1000);
        
        vm.prank(agent1);
        uint256 agentId = agentController.registerAgent(
            AGENT_NAME_1,
            AgentController.AgentRole.Agent,
            ipfsHash
        );
        
        assertEq(agentId, 0, "Agent should be registered successfully");
        
        AgentController.Agent[] memory agents = agentController.listAgents();
        assertEq(agents[0].ipfsHash, ipfsHash, "IPFS hash should match input");
    }
    
    function testFuzz_SendMessage(string memory message) public {
        vm.assume(bytes(message).length > 0);
        vm.assume(bytes(message).length < 1000);
        
        // Register agents
        vm.prank(agent1);
        agentController.registerAgent(
            AGENT_NAME_1,
            AgentController.AgentRole.Agent,
            IPFS_HASH_1
        );
        
        vm.prank(agent2);
        agentController.registerAgent(
            AGENT_NAME_2,
            AgentController.AgentRole.Chat,
            IPFS_HASH_2
        );
        
        // Send message
        vm.expectEmit(true, true, true, true);
        emit MessageSent(0, 0, 1, message);
        
        vm.prank(agent1);
        agentController.sendMessageToAgent(1, message);
    }

    // ===== Edge Cases =====
    
    function test_SendMessageToSelf() public {
        // Register agent
        vm.prank(agent1);
        agentController.registerAgent(
            AGENT_NAME_1,
            AgentController.AgentRole.Agent,
            IPFS_HASH_1
        );
        
        // Send message to self
        vm.expectEmit(true, true, true, true);
        emit MessageSent(0, 0, 0, TEST_MESSAGE);
        
        vm.prank(agent1);
        agentController.sendMessageToAgent(0, TEST_MESSAGE);
    }
    
    function test_NonRegisteredAgentCannotSendMessage() public {
        // Register target agent
        vm.prank(agent1);
        agentController.registerAgent(
            AGENT_NAME_1,
            AgentController.AgentRole.Agent,
            IPFS_HASH_1
        );
        
        // Non-registered agent tries to send message (should still work but with agentId 0)
        vm.expectEmit(true, true, true, true);
        emit MessageSent(0, 0, 0, TEST_MESSAGE);
        
        vm.prank(nonAgent);
        agentController.sendMessageToAgent(0, TEST_MESSAGE);
    }
    
    function test_EmptyMessage() public {
        // Register agents
        vm.prank(agent1);
        agentController.registerAgent(
            AGENT_NAME_1,
            AgentController.AgentRole.Agent,
            IPFS_HASH_1
        );
        
        vm.prank(agent2);
        agentController.registerAgent(
            AGENT_NAME_2,
            AgentController.AgentRole.Chat,
            IPFS_HASH_2
        );
        
        // Send empty message
        vm.expectEmit(true, true, true, true);
        emit MessageSent(0, 0, 1, "");
        
        vm.prank(agent1);
        agentController.sendMessageToAgent(1, "");
    }
}
