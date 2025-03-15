const std = @import("std");
const a = @import("./agent.zig");
const Agent = a.Agent;
const Font = a.Font;
const color_from_u32 = a.color_from_u32;

pub extern fn _print(msg: [*c]const u8, len: usize) void;
pub extern fn _panic(msg: [*c]const u8, len: usize) noreturn;

pub fn panic(msg: []const u8, _: ?*std.builtin.StackTrace, _: ?usize) noreturn {
    _panic(msg.ptr, msg.len);
    @trap();
}

const MemHashMap = std.AutoHashMap([*c]u8, []u8);

var memHashMap: MemHashMap = MemHashMap.init(std.heap.wasm_allocator);

pub export fn malloc(size: c_int) [*c]u8 {
    const slice = std.heap.wasm_allocator.alloc(u8, @intCast(size)) catch std.debug.panic("Allocation failed", .{});
    memHashMap.put(slice.ptr, slice) catch std.debug.panic("Allocation failed", .{});
    return slice.ptr;
}

pub export fn realloc(memory: [*c]u8, size: c_int) [*c]u8 {
    const mem = memHashMap.fetchRemove(memory) orelse std.debug.panic("Tried to realloc unheld memory", .{});
    const slice = std.heap.wasm_allocator.realloc(mem.value, @intCast(size)) catch std.debug.panic("Reallocation failed", .{});
    memHashMap.put(slice.ptr, slice) catch std.debug.panic("Reallocation failed", .{});
    return slice.ptr;
}

pub export fn free(memory: [*c]u8) void {
    const mem = memHashMap.fetchRemove(memory) orelse std.debug.panic("Tried to free unheld memory", .{});
    std.heap.wasm_allocator.free(mem.value);
}

pub export fn __assert_fail(assertion: [*c]const u8, file: [*c]const u8, line: c_uint, _: [*c]const u8) void {
    std.debug.panic("{s}:{} C Assertion failed: {s}", .{ file, line, assertion });
}

pub export fn agent_init() *Agent {
    return Agent.init(std.heap.wasm_allocator) catch std.debug.panic("Failed to init Agent", .{});
}

pub export fn agent_deinit(agent: *Agent) void {
    agent.deinit();
}

pub export fn agent_load_font(agent: *Agent, buf: [*c]u8, len: usize) void {
    _ = agent.load_font(buf[0..len]) catch |err| std.debug.panic("Failed to load font: {s}", .{@errorName(err)});
}

pub export fn agent_get_font_atlas(agent: *Agent) [*c]u8 {
    const font = agent.font orelse std.debug.panic("Failed to get font, no font loaded yet", .{});
    return font.atlas.ptr;
}

pub export fn agent_add_char(agent: *Agent, char: u32) void {
    agent.add_char(@intCast(char)) catch |err| std.debug.panic("Failed to send character to agent: {s}", .{@errorName(err)});
}

pub export fn agent_add_text(agent: *Agent, str: [*c]u8, len: usize) void {
    agent.add_text(str[0..len]) catch |err| std.debug.panic("Failed to send text to agent: {s}", .{@errorName(err)});
}

pub export fn agent_put_key(agent: *Agent, mod: u8, key: u16) void {
    agent.put_key(mod, key) catch |err| std.debug.panic("Failed to send key to agent: {s}", .{@errorName(err)});
}

pub export fn agent_has_key(agent: *Agent, mod: u8, key: u16) bool {
    return agent.has_key(mod, key);
}

pub export fn agent_set_color(agent: *Agent, bg: u32, fg: u32) void {
    agent.set_color(color_from_u32(bg), color_from_u32(fg));
}

pub export fn agent_remove_char(agent: *Agent) void {
    agent.remove_char();
}

pub export fn agent_render_text(agent: *Agent) [*c]u8 {
    agent.render_text() catch |err| std.debug.panic("Failed to render text: {s}", .{@errorName(err)});
    return agent.render_buffer.ptr;
}

pub export fn agent_resize(agent: *Agent, width: i32, height: i32) void {
    if (width < 0 or height < 0) std.debug.panic("Incorrect size", .{});
    agent.resize(.{ .x = width, .y = height }) catch |err| std.debug.panic("Failed to resize render buffer: {s}", .{@errorName(err)});
}
