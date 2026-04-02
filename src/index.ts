/**
 * PROBE - Web3 Intelligence Swarm Project
 *
 * Multi-agent research system that dispatches specialized probes
 * (Scout, Analyst, Sentinel) to investigate Web3 topics from
 * multiple angles, then synthesizes findings into structured
 * intelligence briefings with confidence scores.
 *
 * Self-aware of its Nosana decentralized GPU deployment.
 */

import { type Plugin } from "@elizaos/core";
import { researchTopicAction } from "./actions/research-topic";
import { checkInfraAction } from "./actions/check-infra";
import { researchStateProvider } from "./providers/research-state";
import { historyProvider } from "./providers/history";
import { infrastructureProvider } from "./providers/infrastructure";
import { qualityEvaluator } from "./evaluators/quality";
import { completenessEvaluator } from "./evaluators/completeness";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const probePlugin: Plugin = {
  name: "probe-web3-intelligence",
  description:
    "Multi-agent Web3 research swarm with Scout, Analyst, and Sentinel probes. Synthesizes findings into structured intelligence briefings. Self-aware of Nosana infrastructure.",
  actions: [researchTopicAction, checkInfraAction],
  providers: [researchStateProvider, historyProvider, infrastructureProvider],
  evaluators: [qualityEvaluator, completenessEvaluator],
};

// Load character from JSON file
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = dirname(__filename2);
const characterPath = resolve(__dirname2, "../characters/probe.character.json");
const character = JSON.parse(readFileSync(characterPath, "utf8"));

// Export as project agents format (NOT plugin format)
// This prevents ElizaOS CLI from treating it as a plugin and wrapping in test agent
export default {
  agents: [
    {
      character,
      plugins: [probePlugin],
      init: async () => {
        console.log("[PROBE] Initializing Web3 Intelligence Swarm...");
      },
    },
  ],
};
