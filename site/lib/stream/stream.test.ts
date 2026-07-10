import { describe, it, expect } from "vitest";
import {
  ratePerSecond,
  refundableAt,
  statusAt,
  streamedAt,
  withdrawableAt,
  type Stream,
} from "./stream";

const base: Stream = {
  sender: "0x1111111111111111111111111111111111111111",
  recipient: "0x2222222222222222222222222222222222222222",
  deposit: 3600_000000n, // 3600 USDC
  withdrawn: 0n,
  startTime: 1000,
  stopTime: 1000 + 3600, // 1 hour => 1 USDC/sec
  token: "0x3600000000000000000000000000000000000000",
};

describe("streamedAt", () => {
  it("is zero before start", () => {
    expect(streamedAt(base, 999)).toBe(0n);
    expect(streamedAt(base, 1000)).toBe(0n);
  });

  it("is linear during the window", () => {
    expect(streamedAt(base, 1000 + 900)).toBe(900_000000n); // 25%
    expect(streamedAt(base, 1000 + 1800)).toBe(1800_000000n); // 50%
  });

  it("caps at the deposit after stop", () => {
    expect(streamedAt(base, 1000 + 3600)).toBe(base.deposit);
    expect(streamedAt(base, 1000 + 9999)).toBe(base.deposit);
  });

  it("matches the on-chain integer-division formula", () => {
    // deposit * elapsed / duration, floored
    const t = 1000 + 1234;
    const expected = (base.deposit * 1234n) / 3600n;
    expect(streamedAt(base, t)).toBe(expected);
  });
});

describe("withdrawableAt and refundableAt", () => {
  it("subtracts what was already withdrawn", () => {
    const s = { ...base, withdrawn: 500_000000n };
    expect(withdrawableAt(s, 1000 + 1800)).toBe(1300_000000n); // 1800 vested - 500
  });

  it("refundable is deposit minus streamed", () => {
    expect(refundableAt(base, 1000 + 900)).toBe(2700_000000n);
    expect(refundableAt(base, 1000 + 3600)).toBe(0n);
  });

  it("withdrawable and refundable always sum with withdrawn to the deposit", () => {
    const s = { ...base, withdrawn: 200_000000n };
    for (const t of [1000, 1450, 2800, 5000]) {
      expect(withdrawableAt(s, t) + refundableAt(s, t) + s.withdrawn).toBe(s.deposit);
    }
  });
});

describe("statusAt", () => {
  it("reports the lifecycle", () => {
    expect(statusAt(base, 500)).toBe("pending");
    expect(statusAt(base, 1000 + 10)).toBe("streaming");
    expect(statusAt(base, 1000 + 3600)).toBe("ended");
  });
});

describe("ratePerSecond", () => {
  it("is deposit over duration in whole USDC", () => {
    expect(ratePerSecond(base)).toBeCloseTo(1, 6); // 3600 USDC / 3600s
  });
});
