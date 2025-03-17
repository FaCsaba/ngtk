const std = @import("std");
const json = std.json;
const Adler32 = std.hash.Adler32;
const ArrayList = std.ArrayList;
const Encoder = std.base64.standard.Encoder;
const Decoder = std.base64.standard.Decoder;
const a = @import("./agent.zig");
const Agent = a.Agent;
const AgentInitExt = a.AgentInitExt;

const TestCase = struct {
    name: []const u8,
    input: []const u8,
    init: AgentInitExt,
    output: []const u8 = &[_]u8{},
};

const default_init = AgentInitExt{ .render_size = .{ .x = 50, .y = 50 } };

const default_font = @embedFile("./FiraSansMedium.ttf");

const test_cases_file_name = "src/test_cases.json";

pub fn main() !void {
    var test_cases = [_]TestCase{ .{
        .name = "empty",
        .input = "",
        .init = default_init,
    }, .{
        .name = "A",
        .input = "A",
        .init = default_init,
    }, .{
        .name = "Out of bounds x",
        .input = "Out of bounds x",
        .init = .{ .render_size = .{ .x = 100, .y = 100 } },
    }, .{
        .name = "Out of bounds y",
        .input = "Out\nof\nbounds\ny",
        .init = .{ .render_size = .{ .x = 100, .y = 100 } },
    }, .{
        .name = "Not defined glyphs",
        .input = "你好",
        .init = default_init,
    } };

    var heap = std.heap.HeapAllocator.init();
    const allocator = heap.allocator();

    const file = try std.fs.cwd().createFile(test_cases_file_name, .{});
    defer file.close();

    for (&test_cases) |*test_case| {
        const agent = try Agent.init(allocator, test_case.init);
        defer agent.deinit();
        _ = try agent.load_font(default_font);
        try agent.add_text(test_case.input);
        try agent.render_text();
        const size = Encoder.calcSize(agent.render_buffer.len);
        const output = try allocator.alloc(u8, size);
        _ = Encoder.encode(output, agent.render_buffer);
        test_case.output = output;
    }
    try json.stringify(test_cases, .{}, file.writer());
}

test "recorded" {
    _ = Agent;
    const file = try std.fs.cwd().openFile(test_cases_file_name, .{});
    defer file.close();
    const file_reader = file.reader();

    var heap = std.heap.HeapAllocator.init();
    const allocator = heap.allocator();
    var reader = std.json.reader(allocator, file_reader);

    const test_cases_parsed = try json.parseFromTokenSource([]TestCase, allocator, &reader, .{});
    defer test_cases_parsed.deinit();
    const test_cases = test_cases_parsed.value;

    std.fs.cwd().makeDir("test-out") catch |err| {
        switch (err) {
            error.PathAlreadyExists => {},
            else => return err,
        }
    };

    for (test_cases) |test_case| {
        const agent = try Agent.init(allocator, test_case.init);
        defer agent.deinit();
        _ = try agent.load_font(default_font);
        try agent.add_text(test_case.input);
        try agent.render_text();
        const actual = agent.render_buffer;
        const size = try Decoder.calcSizeForSlice(test_case.output);
        const expected = try allocator.alloc(u8, size);
        _ = try Decoder.decode(expected, test_case.output);

        try write_png("test-out/{s}.expected.png", .{test_case.name}, agent.render_size.x, agent.render_size.y, expected);
        try write_png("test-out/{s}.actual.png", .{test_case.name}, agent.render_size.x, agent.render_size.y, actual);

        const diff = try allocator.alloc(u8, expected.len);
        var i: usize = 0;
        while (i < actual.len) : (i += 4) {
            var eql = true;
            for (actual[i..(i + 4)], expected[i..(i + 4)], i..) |actual_b, expected_b, b| {
                eql = eql and actual_b == expected_b;
                diff[b] = actual_b;
            }
            if (!eql) {
                diff[i + 0] = 0x7F;
                diff[i + 1] = 0x7F;
                diff[i + 2] = 0xFF;
                diff[i + 3] = 0xFF;
            }
        }
        try write_png("test-out/{s}.diff.png", .{test_case.name}, agent.render_size.x, agent.render_size.y, diff);

        try std.testing.expectEqualSlices(u8, expected, actual);
    }
}

const stbi_write_png = @cImport(@cInclude("stb/stb_image_write.h")).stbi_write_png;
fn write_png(comptime name_fmt: []const u8, name_args: anytype, width: i32, height: i32, data: []const u8) !void {
    var name_buff: [1024]u8 = undefined;
    _ = try std.fmt.bufPrintZ(&name_buff, name_fmt, name_args);
    _ = stbi_write_png(&name_buff, width, height, 4, data.ptr, 0);
}
