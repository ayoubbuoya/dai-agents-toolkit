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

    event AgentRated(
        uint256 indexed agentId,
        uint256 indexed raterAgentId,
        bool positive,
        string comment
    );

    event TrustScoreUpdated(
        uint256 indexed agentId,
        uint256 newTrustScore,
        uint256 totalInteractions
    );

    struct Agent {
        uint256 id;
        string name;
        AgentRole role;
        string ipfsHash; // Optional IPFS hash for additional metadata about the agent.
        uint256 trustScore; // Trust score percentage (0-100)
        uint256 totalInteractions; // Total number of interactions
        uint256 positiveRatings; // Number of positive ratings received
    }

    // Enum for agent roles
    enum AgentRole {
        Agent, // Represents a standard agent that supports various tasks (Tool Capabilities).
        Chat // Represents a chat agent that can only answer questions.
    }

    mapping(uint256 => Agent) private agents;
    mapping(address => uint256) private agentIds;
    
    // Reputation system mappings
    mapping(uint256 => mapping(uint256 => bool)) private hasRated; // agentId => raterAgentId => hasRated
    mapping(uint256 => mapping(uint256 => bool)) private ratingValue; // agentId => raterAgentId => positive/negative
    
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
        agents[agentId] = Agent(agentId, name, role, ipfsHash, 100, 0, 0); // Start with 100% trust score
        agentIds[msg.sender] = agentId;
        
        // Emit the AgentRegistered event
        string memory roleString = role == AgentRole.Agent ? "Agent" : "Chat";
        emit AgentRegistered(agentId, msg.sender, name, roleString, ipfsHash);
        
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

    /**
     * Rate an agent's performance (positive or negative).
     * Only registered agents can rate other agents.
     * An agent can only rate another agent once.
     * @param agentId The ID of the agent to rate.
     * @param positive True for positive rating, false for negative.
     * @param comment Optional comment about the rating.
     */
    function rateAgent(uint256 agentId, bool positive, string memory comment) public {
        uint256 raterAgentId = agentIds[msg.sender];
        require(raterAgentId != 0, "RATER_NOT_REGISTERED");
        require(agentId < nextId, "AGENT_NOT_FOUND");
        require(raterAgentId != agentId, "CANNOT_RATE_SELF");
        require(!hasRated[agentId][raterAgentId], "ALREADY_RATED");

        // Mark as rated and store the rating
        hasRated[agentId][raterAgentId] = true;
        ratingValue[agentId][raterAgentId] = positive;

        // Update agent's reputation stats
        agents[agentId].totalInteractions++;
        if (positive) {
            agents[agentId].positiveRatings++;
        }

        // Calculate new trust score (percentage)
        uint256 newTrustScore = (agents[agentId].positiveRatings * 100) / agents[agentId].totalInteractions;
        agents[agentId].trustScore = newTrustScore;

        // Emit events
        emit AgentRated(agentId, raterAgentId, positive, comment);
        emit TrustScoreUpdated(agentId, newTrustScore, agents[agentId].totalInteractions);
    }

    /**
     * Get an agent's trust score and reputation details.
     * @param agentId The ID of the agent.
     * @return trustScore The trust score percentage (0-100).
     * @return totalInteractions Total number of interactions.
     * @return positiveRatings Number of positive ratings.
     */
    function getAgentReputation(uint256 agentId) public view returns (
        uint256 trustScore,
        uint256 totalInteractions,
        uint256 positiveRatings
    ) {
        require(agentId < nextId, "AGENT_NOT_FOUND");
        Agent memory agent = agents[agentId];
        return (agent.trustScore, agent.totalInteractions, agent.positiveRatings);
    }

    /**
     * Check if a rater has already rated a specific agent.
     * @param agentId The ID of the agent being rated.
     * @param raterAgentId The ID of the agent doing the rating.
     * @return True if the rater has already rated this agent.
     */
    function hasAgentRated(uint256 agentId, uint256 raterAgentId) public view returns (bool) {
        return hasRated[agentId][raterAgentId];
    }

    /**
     * Get the rating given by a specific rater to an agent.
     * @param agentId The ID of the agent being rated.
     * @param raterAgentId The ID of the agent doing the rating.
     * @return True if positive rating, false if negative. Only valid if hasRated is true.
     */
    function getRating(uint256 agentId, uint256 raterAgentId) public view returns (bool) {
        require(hasRated[agentId][raterAgentId], "NO_RATING_EXISTS");
        return ratingValue[agentId][raterAgentId];
    }

    /**
     * Get agents sorted by trust score (highest first).
     * Note: This is a simple implementation. For large datasets, consider off-chain sorting.
     * @return An array of agents sorted by trust score.
     */
    function getTopRatedAgents() public view returns (Agent[] memory) {
        Agent[] memory agentList = new Agent[](nextId);
        for (uint256 i = 0; i < nextId; i++) {
            agentList[i] = agents[i];
        }

        // Simple bubble sort by trust score (descending)
        for (uint256 i = 0; i < nextId; i++) {
            for (uint256 j = i + 1; j < nextId; j++) {
                if (agentList[i].trustScore < agentList[j].trustScore) {
                    Agent memory temp = agentList[i];
                    agentList[i] = agentList[j];
                    agentList[j] = temp;
                }
            }
        }

        return agentList;
    }
}
