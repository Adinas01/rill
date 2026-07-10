/** StreamPay ABI surface used by the SDK and apps. */
export const streamPayAbi = [
  {
    type: "function",
    name: "createStream",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "token", type: "address" },
      { name: "deposit", type: "uint256" },
      { name: "startTime", type: "uint40" },
      { name: "stopTime", type: "uint40" },
    ],
    outputs: [{ name: "streamId", type: "uint256" }],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [
      { name: "streamId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "cancelStream",
    stateMutability: "nonpayable",
    inputs: [{ name: "streamId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "streamedAmount",
    stateMutability: "view",
    inputs: [{ name: "streamId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "withdrawableOf",
    stateMutability: "view",
    inputs: [{ name: "streamId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "senderBalanceOf",
    stateMutability: "view",
    inputs: [{ name: "streamId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getStream",
    stateMutability: "view",
    inputs: [{ name: "streamId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "sender", type: "address" },
          { name: "recipient", type: "address" },
          { name: "deposit", type: "uint256" },
          { name: "withdrawn", type: "uint256" },
          { name: "startTime", type: "uint40" },
          { name: "stopTime", type: "uint40" },
          { name: "token", type: "address" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "nextStreamId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "StreamCreated",
    inputs: [
      { name: "streamId", type: "uint256", indexed: true },
      { name: "sender", type: "address", indexed: true },
      { name: "recipient", type: "address", indexed: true },
      { name: "token", type: "address", indexed: false },
      { name: "deposit", type: "uint256", indexed: false },
      { name: "startTime", type: "uint40", indexed: false },
      { name: "stopTime", type: "uint40", indexed: false },
    ],
  },
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
