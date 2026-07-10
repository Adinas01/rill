// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "openzeppelin-contracts/token/ERC20/ERC20.sol";
import {IERC20} from "openzeppelin-contracts/token/ERC20/IERC20.sol";
import {StreamPay} from "../src/StreamPay.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

contract StreamPayTest is Test {
    StreamPay internal pay;
    MockUSDC internal usdc;

    address internal sender = address(0x5E);
    address internal recipient = address(0xDF);
    uint40 internal start;
    uint40 internal stop;
    uint256 internal deposit = 3600e6; // 3600 USDC over 1h => 1 USDC/sec

    function setUp() public {
        pay = new StreamPay();
        usdc = new MockUSDC();
        start = uint40(block.timestamp);
        stop = uint40(block.timestamp + 3600);

        usdc.mint(sender, 10_000e6);
        vm.prank(sender);
        usdc.approve(address(pay), type(uint256).max);
    }

    function _create() internal returns (uint256 id) {
        vm.prank(sender);
        id = pay.createStream(recipient, IERC20(address(usdc)), deposit, start, stop);
    }

    function test_create_pullsDepositAndStores() public {
        uint256 id = _create();
        assertEq(usdc.balanceOf(address(pay)), deposit);
        StreamPay.Stream memory s = pay.getStream(id);
        assertEq(s.sender, sender);
        assertEq(s.recipient, recipient);
        assertEq(s.deposit, deposit);
    }

    function test_streamedAmount_linear() public {
        uint256 id = _create();
        assertEq(pay.streamedAmount(id), 0);
        vm.warp(start + 900); // 25%
        assertEq(pay.streamedAmount(id), 900e6);
        vm.warp(start + 3600); // 100%
        assertEq(pay.streamedAmount(id), deposit);
        vm.warp(start + 4000); // capped
        assertEq(pay.streamedAmount(id), deposit);
    }

    function test_withdraw_onlyVested() public {
        uint256 id = _create();
        vm.warp(start + 1800); // 50% => 1800 USDC

        vm.prank(recipient);
        pay.withdraw(id, 1800e6);
        assertEq(usdc.balanceOf(recipient), 1800e6);

        vm.prank(recipient);
        vm.expectRevert(StreamPay.AmountExceedsBalance.selector);
        pay.withdraw(id, 1);
    }

    function test_withdraw_rejectsNonRecipient() public {
        uint256 id = _create();
        vm.warp(start + 1800);
        vm.prank(sender);
        vm.expectRevert(StreamPay.NotRecipient.selector);
        pay.withdraw(id, 1e6);
    }

    function test_cancel_splitsByStreamed() public {
        uint256 id = _create();
        vm.warp(start + 900); // 25% => recipient 900, sender 2700

        vm.prank(sender);
        pay.cancelStream(id);

        assertEq(usdc.balanceOf(recipient), 900e6);
        assertEq(usdc.balanceOf(sender), 10_000e6 - deposit + 2700e6);
        vm.expectRevert(StreamPay.StreamMissing.selector);
        pay.getStream(id);
    }

    function test_cancel_accountsForPriorWithdrawals() public {
        uint256 id = _create();
        vm.warp(start + 1800); // 50%
        vm.prank(recipient);
        pay.withdraw(id, 1000e6); // recipient took 1000 of the 1800 vested

        vm.prank(recipient);
        pay.cancelStream(id);

        // recipient: 1000 withdrawn + 800 remaining vested = 1800; sender: 1800
        assertEq(usdc.balanceOf(recipient), 1800e6);
        assertEq(usdc.balanceOf(sender), 10_000e6 - deposit + 1800e6);
    }

    function test_create_rejectsBadWindow() public {
        vm.prank(sender);
        vm.expectRevert(StreamPay.BadTimeWindow.selector);
        pay.createStream(recipient, IERC20(address(usdc)), deposit, stop, start);
    }

    function testFuzz_streamed_neverExceedsDeposit(uint40 t) public {
        uint256 id = _create();
        vm.warp(t);
        assertLe(pay.streamedAmount(id), deposit);
    }
}
