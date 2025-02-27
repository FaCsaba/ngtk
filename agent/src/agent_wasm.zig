const std = @import("std");
const a = @import("./agent.zig");
const Agent = a.Agent;
const Font = a.Font;

pub extern fn _print(msg: [*c]const u8) void;
pub extern fn _panic(msg: [*c]const u8) noreturn;

pub fn panic(msg: []const u8, _: ?*std.builtin.StackTrace, _: ?usize) noreturn {
    _panic(msg.ptr);
    @trap();
}

const MemHashMap = std.AutoHashMap([*c]u8, []u8);

var memHashMap: MemHashMap = MemHashMap.init(std.heap.wasm_allocator);

pub export fn malloc(size: c_int) [*c]u8 {
    const slice = std.heap.wasm_allocator.alloc(u8, @intCast(size)) catch _panic("Allocation failed");
    memHashMap.put(slice.ptr, slice) catch _panic("Allocation failed");
    return slice.ptr;
}

pub export fn realloc(memory: [*c]u8, size: c_int) [*c]u8 {
    const mem = memHashMap.fetchRemove(memory) orelse _panic("Tried to realloc unheld memory");
    const slice = std.heap.wasm_allocator.realloc(mem.value, @intCast(size)) catch _panic("Reallocation failed");
    memHashMap.put(slice.ptr, slice) catch _panic("Reallocation failed");
    return slice.ptr;
}

pub export fn free(memory: [*c]u8) void {
    const mem = memHashMap.fetchRemove(memory) orelse _panic("Tried to free unheld memory");
    std.heap.wasm_allocator.free(mem.value);
}

pub export fn __assert_fail(assertion: [*c]const u8, file: [*c]const u8, line: c_uint, _: [*c]const u8) void {
    var buff: [1024:0]u8 = undefined;
    _ = std.fmt.bufPrintZ(&buff, "{s}:{} Assertion failed: {s}", .{ file, line, assertion }) catch _panic("Failed to format while assert failed");
    _panic(&buff);
}

pub export fn agent_init() *Agent {
    return Agent.init(std.heap.wasm_allocator) catch _panic("Failed to init Agent");
}

pub export fn agent_load_font(agent: *Agent, buf: [*c]u8, len: usize) void {
    _ = agent.load_font(buf[0..len]) catch |err| std.debug.panic("Failed to load font: {s}\x00", .{@errorName(err)});
}

pub export fn agent_get_font_atlas(agent: *Agent) [*c]u8 {
    const font = agent.font orelse _panic("Failed to get font, no font loaded yet");
    return font.atlas.ptr;
}

pub export fn agent_render_text(agent: *Agent, str: [*c]u8, len: usize) [*c]u8 {
    agent.render_text(str[0..len]) catch |err| std.debug.panic("Failed to render text: {s}\x00", .{@errorName(err)});
    return agent.rendered_text.ptr;
}
