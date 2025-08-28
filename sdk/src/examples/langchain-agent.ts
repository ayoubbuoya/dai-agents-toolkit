import { AgentSDK, AgentRole, SDKConfig, DeploymentConfig } from "../index.js";
import { ChatOpenAI } from "@langchain/openai";

/**
 * LangChain-powered agent example
 * - Creates a LangChain chat agent
 * - Registers it on-chain via the SDK
 * - Starts event monitoring and auto-responds to incoming messages
 *
 * Env vars required:
 * - RPC_URL: JSON-RPC endpoint
 * - PRIVATE_KEY: EOA private key with funds
 * - CONTRACT_ADDRESS: existing AgentController address (optional if DEPLOY_NEW=1)
 * - CHAIN_ID: chain id (required if deploying)
 * - OPENAI_API_KEY: for LangChain OpenAI client
 * - OPENAI_MODEL: optional (default: gpt-4o-mini)
 * - DEPLOY_NEW: set to "1" to deploy a new controller
 */

async function getSdk(): Promise<AgentSDK> {
  const rpcUrl = process.env.RPC_URL || "http://localhost:8545";
  const privateKey = process.env.PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const deployNew = process.env.DEPLOY_NEW === "1";

  if (!privateKey) throw new Error("PRIVATE_KEY is required");

  if (deployNew) {
    const chainId = process.env.CHAIN_ID ? Number(process.env.CHAIN_ID) : undefined;
    if (!chainId) throw new Error("CHAIN_ID is required when DEPLOY_NEW=1");

    const deployCfg: DeploymentConfig = { rpcUrl, privateKey, chainId };
    console.log("Deploying AgentController...");
    const sdk = await AgentSDK.deployController(deployCfg);
    console.log("Deployed at:", await sdk.getContractAddress());
    return sdk;
  }

  if (!contractAddress) throw new Error("CONTRACT_ADDRESS is required (or set DEPLOY_NEW=1)");

  const cfg: SDKConfig = { rpcUrl, privateKey, contractAddress };
  return new AgentSDK(cfg);
}

function getLlm() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is required for LangChain OpenAI client");
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  return new ChatOpenAI({ apiKey, model });
}

async function run() {
  const sdk = await getSdk();
  const llm = getLlm();

  // 1) Register the LangChain agent on-chain
  console.log("Registering LangChain agent...");
  const { agentId } = await sdk.createNewAgent({
    name: "LangChain Chat Agent",
    role: AgentRole.Chat,
    ipfsHash: "QmLangChainAgentMeta", // replace with IPFS hash for your agent metadata
  });
  console.log("Agent registered with ID:", agentId.toString());

  // 2) Start event monitoring
  sdk.onError((e) => console.error("Monitor error:", e));

  sdk.onMessageSent((event) => {
    // Only respond to messages addressed to this agent
    if (event.receiverAgentId !== agentId) return;

    // Process in background to avoid blocking the event loop
    (async () => {
      try {
        console.log("Incoming message ->", {
          messageId: event.messageId.toString(),
          from: event.senderAgentId.toString(),
          to: event.receiverAgentId.toString(),
          text: event.message,
        });

        // 3) Use LangChain to generate a response
        const aiMsg = await llm.invoke(
          `You are a helpful on-chain agent. Reply concisely. User said: ${event.message}`
        );

        const response = typeof aiMsg.content === "string"
          ? aiMsg.content
          : Array.isArray(aiMsg.content)
            ? aiMsg.content.map((c: any) => (typeof c?.text === "string" ? c.text : "")).join("\n")
            : String(aiMsg.content ?? "");

        // 4) Send the response back on-chain
        const tx = await sdk.respondToMessage({
          messageId: event.messageId,
          receiverAgentId: event.senderAgentId, // reply to the original sender
          response,
        });

        console.log("Responded. Tx:", tx.transactionHash);
      } catch (err) {
        console.error("Failed to handle message:", err);
      }
    })();
  });

  await sdk.startEventMonitoring({ fromBlock: "latest", pollInterval: 2000 });
  console.log("Event monitoring started. Waiting for messages...");

  // Optional: create a second agent and send a test message to the LangChain agent
  if (process.env.CREATE_TEST_SENDER === "1") {
    console.log("Creating a test sender agent and sending a message...");
    const sender = await sdk.createNewAgent({
      name: "Test Sender",
      role: AgentRole.Agent,
      ipfsHash: "QmTestSenderMeta",
    });

    const sent = await sdk.sendMessage({
      agentId, // send to LangChain agent
      message: "Hello LangChain agent! Summarize: The quick brown fox jumps over the lazy dog.",
    });

    console.log("Test message id:", sent.messageId.toString());
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}