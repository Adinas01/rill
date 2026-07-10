// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "openzeppelin-contracts/token/ERC20/ERC20.sol";
import {IERC20} from "openzeppelin-contracts/token/ERC20/IERC20.sol";
import {StreamPay} from "../src/StreamPay.sol";

contract MockToken is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

contract StreamPayEdgeTest is Test {
    StreamPay internal pay;
    MockToken internal usdc;
    address internal sender = address(0x51);
    address internal recipient = address(0x52);
    uint40 internal start;
    uint40 internal stop;
    uint256 internal deposit = 1000e6;

    function setUp() public {
        pay = new StreamPay();
        usdc = new MockToken();
        start = uint40(block.timestamp);
        stop = uint40(block.timestamp + 1000); // 1 USDC/sec
        usdc.mint(sender, 5000e6);
        vm.prank(sender);
        usdc.approve(address(pay), type(uint256).max);
    }

    function _open() internal returns (uint256 id) {
        vm.prank(sender);
        id = pay.createStream(recipient, IERC20(address(usdc)), deposit, start, stop);
    }

    function test_withdrawFull_deletesStream() public {
        uint256 id = _open();
        vm.warp(stop + 1);
        vm.prank(recipient);
        pay.withdraw(id, deposit);
        assertEq(usdc.balanceOf(recipient), deposit);
        vm.expectRevert(StreamPay.StreamMissing.selector);
        pay.getStream(id);
    }

    function test_cancelByRecipient_splits() public {
        uint256 id = _open();
        vm.warp(start + 400); // 40% => recipient 400, sender 600
        vm.prank(recipient);
        pay.cancelStream(id);
        assertEq(usdc.balanceOf(recipient), 400e6);
        assertEq(usdc.balanceOf(sender), 5000e6 - deposit + 600e6);
    }

    function test_cancelByStranger_reverts() public {
        uint256 id = _open();
        vm.warp(start + 100);
        vm.prank(address(0xDEAD));
        vm.expectRevert(StreamPay.NotParty.selector);
        pay.cancelStream(id);
    }

    function test_views_reflectState() public {
        uint256 id = _open();
        vm.warp(start + 250);
        assertEq(pay.streamedAmount(id), 250e6);
        assertEq(pay.withdrawableOf(id), 250e6);
        assertEq(pay.senderBalanceOf(id), 750e6);
    }

    function test_create_rejectsZeroDeposit() public {
        vm.prank(sender);
        vm.expectRevert(StreamPay.ZeroDeposit.selector);
        pay.createStream(recipient, IERC20(address(usdc)), 0, start, stop);
    }

    function test_create_rejectsZeroRecipient() public {
        vm.prank(sender);
        vm.expectRevert(StreamPay.ZeroAddress.selector);
        pay.createStream(address(0), IERC20(address(usdc)), deposit, start, stop);
    }

    function test_create_rejectsStopInPast() public {
        vm.warp(2000);
        vm.prank(sender);
        vm.expectRevert(StreamPay.BadTimeWindow.selector);
        pay.createStream(recipient, IERC20(address(usdc)), deposit, 1000, 1500);
    }

    function test_getStream_revertsForMissing() public {
        vm.expectRevert(StreamPay.StreamMissing.selector);
        pay.getStream(999);
    }

    function test_streamIds_increment() public {
        uint256 a = _open();
        uint256 b = _open();
        assertEq(b, a + 1);
    }
}
