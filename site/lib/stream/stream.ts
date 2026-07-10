import type { Address } from "viem";

/** Mirror of the on-chain Stream struct. */
export interface Stream {
  sender: Address;
  recipient: Address;
  deposit: bigint;
  withdrawn: bigint;
  startTime: number;
  stopTime: number;
  token: Address;
}

/**
 * Amount streamed at time `nowSec` (unix seconds), computed exactly the same way
 * as the contract. Lets a UI tick the streamed value every second without an
 * RPC call per frame.
 */
export function streamedAt(stream: Stream, nowSec: number): bigint {
  if (nowSec <= stream.startTime) return 0n;
  if (nowSec >= stream.stopTime) return stream.deposit;
  const elapsed = BigInt(nowSec - stream.startTime);
  const duration = BigInt(stream.stopTime - stream.startTime);
  return (stream.deposit * elapsed) / duration;
}

/** Recipient's withdrawable balance at `nowSec`. */
export function withdrawableAt(stream: Stream, nowSec: number): bigint {
  return streamedAt(stream, nowSec) - stream.withdrawn;
}

/** Sender's refundable balance at `nowSec`. */
export function refundableAt(stream: Stream, nowSec: number): bigint {
  return stream.deposit - streamedAt(stream, nowSec);
}

/** Tokens streamed per second (as a float, for display only). */
export function ratePerSecond(stream: Stream, decimals = 6): number {
  const duration = stream.stopTime - stream.startTime;
  if (duration <= 0) return 0;
  return Number(stream.deposit) / 10 ** decimals / duration;
}

export type StreamStatus = "pending" | "streaming" | "ended";

export function statusAt(stream: Stream, nowSec: number): StreamStatus {
  if (nowSec < stream.startTime) return "pending";
  if (nowSec >= stream.stopTime) return "ended";
  return "streaming";
}
