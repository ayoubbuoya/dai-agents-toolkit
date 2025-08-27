// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

contract AgentController {
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

    event AgentRegistered(
        uint256 indexed agentId,
        address indexed agentAddress,
        string name,
        string role,
        string ipfsHash
    );

    event AgentUpdated(
        uint256 indexed agentId,
        string name,
        string role,
        string ipfsHash
    );

    struct Agent {
        uint256 id;
        string name;
        AgentRole role;
        string ipfsHash; // Optional IPFS hash for additional metadata about the agent.
    }

    // Enum for agent roles
    enum AgentRole {
        Agent, // Represents a standard agent that supports various tasks (Tool Capabilities).
        Chat // Represents a chat agent that can only answer questions.
    }

    mapping(uint256 => Agent) private agents;
    mapping(address => uint256) private agentIds;

    uint256 private nextId;
    uint256 private messageIdCounter;

    /**
     * Register a new agent.
     * Each agent is assigned a unique ID upon registration.
     * @param name The name of the agent.
     * @param role The role of the agent.
     * @return The ID of the newly registered agent.
     */
    function registerAgent(
        string memory name,
        AgentRole role,
        string memory ipfsHash
    ) public returns (uint256) {
        uint256 agentId = nextId++;
        agents[agentId] = Agent(agentId, name, role, ipfsHash);
        agentIds[msg.sender] = agentId;
        return agentId;
    }

    /**
     * List all registered agents.
     * @return An array of all registered agents.
     */
    function listAgents() public view returns (Agent[] memory) {
        Agent[] memory agentList = new Agent[](nextId);
        for (uint256 i = 0; i < nextId; i++) {
            agentList[i] = agents[i];
        }
        return agentList;
    }

    /**
     * Count the total number of agents.
     * @return The total number of agents.
     */
    function countAgents() public view returns (uint256) {
        return nextId;
    }

    /**
     * Send a message to a specific agent with a messageId.
     * @param agentId The ID of the agent to send the message to.
     * @param message The message to send.
     */
    function sendMessageToAgent(uint256 agentId, string memory message) public {
        require(nextId > agentId, "AGENT_NOT_FOUND");
        uint256 senderAgentId = agentIds[msg.sender];
        uint256 messageId = messageIdCounter++;
        emit MessageSent(messageId, senderAgentId, agentId, message);
    }

    /**
     * Respond to a specific message from an agent.
     * @param messageId The ID of the message being responded to.
     * @param receiverAgentId The ID of the agent to respond to.
     * @param response The response message.
     */
    function respondToAgent(
        uint256 messageId,
        uint256 receiverAgentId,
        string memory response
    ) public {
        require(nextId > receiverAgentId, "RECV_AGENT_NOT_FOUND");
        uint256 responderAgentId = agentIds[msg.sender];
        emit MessageResponded(
            messageId,
            responderAgentId,
            receiverAgentId,
            response
        );
    }
}
