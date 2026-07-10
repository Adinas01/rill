import { arcTestnet, defineArcChain } from "@/lib/stream";

export const net = arcTestnet;
export const arcChain = defineArcChain(net);
