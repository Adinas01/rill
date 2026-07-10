// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IERC20} from "openzeppelin-contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/utils/ReentrancyGuard.sol";

/// @title StreamPay
/// @notice Continuous USDC payment streams on Arc. A sender locks USDC that
///         vests to the recipient linearly per second between a start and stop
///         time. The recipient withdraws what has vested; either party can
///         cancel, splitting the balance by what has streamed so far.
/// @dev Uses a deposit/start/stop model (not a stored per-second rate) so the
///      streamed amount is computed exactly and no dust is stranded by rounding.
contract StreamPay is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Stream {
        address sender;
        address recipient;
        uint256 deposit;
        uint256 withdrawn;
        uint40 startTime;
        uint40 stopTime;
        IERC20 token;
    }

    uint256 public nextStreamId = 1;
    mapping(uint256 id => Stream) private _streams;

    event StreamCreated(
        uint256 indexed streamId,
        address indexed sender,
        address indexed recipient,
        address token,
        uint256 deposit,
        uint40 startTime,
        uint40 stopTime
    );
    event Withdrawn(uint256 indexed streamId, address indexed recipient, uint256 amount);
    event Cancelled(
        uint256 indexed streamId,
        address indexed sender,
        address indexed recipient,
        uint256 senderBalance,
        uint256 recipientBalance
    );

    error ZeroAddress();
    error ZeroDeposit();
    error BadTimeWindow();
    error StreamMissing();
    error NotRecipient();
    error NotParty();
    error AmountExceedsBalance();

    modifier exists(uint256 streamId) {
        if (_streams[streamId].sender == address(0)) revert StreamMissing();
        _;
    }

    /// @notice Create a stream, pulling `deposit` of `token` from the caller.
    /// @param recipient Who the funds stream to.
    /// @param token ERC20 being streamed (USDC on Arc).
    /// @param deposit Total amount locked and streamed over the window.
    /// @param startTime Unix time the stream starts vesting.
    /// @param stopTime Unix time the stream is fully vested.
    /// @return streamId Identifier of the new stream.
    function createStream(
        address recipient,
        IERC20 token,
        uint256 deposit,
        uint40 startTime,
        uint40 stopTime
    ) external nonReentrant returns (uint256 streamId) {
        if (recipient == address(0) || recipient == address(this)) revert ZeroAddress();
        if (deposit == 0) revert ZeroDeposit();
        if (stopTime <= startTime || stopTime <= block.timestamp) revert BadTimeWindow();

        streamId = nextStreamId++;
        _streams[streamId] = Stream({
            sender: msg.sender,
            recipient: recipient,
            deposit: deposit,
            withdrawn: 0,
            startTime: startTime,
            stopTime: stopTime,
            token: token
        });

        token.safeTransferFrom(msg.sender, address(this), deposit);
        emit StreamCreated(streamId, msg.sender, recipient, address(token), deposit, startTime, stopTime);
    }

    /// @notice Amount vested to the recipient at the current time.
    function streamedAmount(uint256 streamId) public view exists(streamId) returns (uint256) {
        Stream storage s = _streams[streamId];
        if (block.timestamp <= s.startTime) return 0;
        if (block.timestamp >= s.stopTime) return s.deposit;
        uint256 elapsed = block.timestamp - s.startTime;
        uint256 duration = s.stopTime - s.startTime;
        // deposit * elapsed / duration, elapsed < duration so no overflow beyond deposit.
        return (s.deposit * elapsed) / duration;
    }

    /// @notice Amount the recipient can withdraw right now.
    function withdrawableOf(uint256 streamId) public view exists(streamId) returns (uint256) {
        return streamedAmount(streamId) - _streams[streamId].withdrawn;
    }

    /// @notice Amount still refundable to the sender if cancelled now.
    function senderBalanceOf(uint256 streamId) public view exists(streamId) returns (uint256) {
        return _streams[streamId].deposit - streamedAmount(streamId);
    }

    /// @notice Recipient withdraws up to their vested, un-withdrawn balance.
    function withdraw(uint256 streamId, uint256 amount) external nonReentrant exists(streamId) {
        Stream storage s = _streams[streamId];
        if (msg.sender != s.recipient) revert NotRecipient();
        if (amount == 0 || amount > streamedAmount(streamId) - s.withdrawn) revert AmountExceedsBalance();

        s.withdrawn += amount;
        IERC20 token = s.token;
        address recipient = s.recipient;
        if (s.withdrawn == s.deposit) delete _streams[streamId];

        token.safeTransfer(recipient, amount);
        emit Withdrawn(streamId, recipient, amount);
    }

    /// @notice Cancel a stream. Vested-but-unwithdrawn funds go to the recipient,
    ///         the remainder returns to the sender. Callable by either party.
    function cancelStream(uint256 streamId) external nonReentrant exists(streamId) {
        Stream memory s = _streams[streamId];
        if (msg.sender != s.sender && msg.sender != s.recipient) revert NotParty();

        uint256 streamed = streamedAmount(streamId);
        uint256 recipientBalance = streamed - s.withdrawn;
        uint256 senderBalance = s.deposit - streamed;

        delete _streams[streamId];

        if (recipientBalance > 0) s.token.safeTransfer(s.recipient, recipientBalance);
        if (senderBalance > 0) s.token.safeTransfer(s.sender, senderBalance);
        emit Cancelled(streamId, s.sender, s.recipient, senderBalance, recipientBalance);
    }

    /// @notice Full stream record. Reverts if the stream does not exist.
    function getStream(uint256 streamId) external view exists(streamId) returns (Stream memory) {
        return _streams[streamId];
    }
}
